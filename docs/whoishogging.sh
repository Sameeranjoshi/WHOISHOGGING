#!/usr/bin/env bash
# whoishogging.sh — find who is occupying nodes with a given GPU type
# Usage: ./whoishogging.sh <gpu_type>   e.g.  h100  a100  h200  a6000  3090  l40s
#        ./whoishogging.sh              (no filter — shows all GPU hogs)

GPU="${1:-}"

[[ -z "$GPU" ]] && echo "Tip: ./whoishogging.sh <gpu_filter> — e.g. h100, a100, h200, a6000"

# --- user info cache: avoid re-querying the same user ---
declare -A USER_NAME USER_GROUP
user_info() {
  local uid="$1"
  [[ -n "${USER_NAME[$uid]}" ]] && return
  local entry gid
  entry=$(getent passwd "$uid" 2>/dev/null)
  USER_NAME[$uid]=$(echo "$entry" | cut -d: -f5 | sed 's/,.*//')
  gid=$(echo "$entry" | cut -d: -f4)
  USER_GROUP[$uid]=$(getent group "$gid" 2>/dev/null | cut -d: -f1)
  [[ -z "${USER_NAME[$uid]}" ]]  && USER_NAME[$uid]="unknown"
  [[ -z "${USER_GROUP[$uid]}" ]] && USER_GROUP[$uid]="unknown"
}

# --- step 1: find matching nodes (inject cluster name explicitly) ---
echo ""
echo "Searching for GPU nodes matching: ${GPU:-'(all)'} ..."

TMPFILE=$(mktemp /tmp/whoishogging.XXXX)
for cl in granite notchpeak kingspeak lonepeak; do
  sinfo -M "$cl" -h -N -o "%N|%G" 2>/dev/null | grep -v "^$" | sort -u | \
  while IFS='|' read node gres; do
    echo "$gres" | tr ',' '\n' | grep -oP 'gpu:[^:(]+:[0-9]+' | \
    while read entry; do
      gputype=$(echo "$entry" | awk -F: '{print $2}')
      count=$(echo "$entry"   | awk -F: '{print $3}')
      [[ "$gputype" =~ [0-9]g\.[0-9] ]] && continue      # skip MIG sub-slices
      [[ -n "$GPU" ]] && echo "$gputype" | grep -qiv "$GPU" && continue
      echo "$cl|$node|$gputype|$count"
    done
  done
done | sort -u > "$TMPFILE"

node_count=$(cut -d'|' -f2 "$TMPFILE" | sort -u | wc -l)
echo "Found $node_count node(s). Checking allocations..."
echo ""

if [[ ! -s "$TMPFILE" ]]; then
  echo "No nodes found matching GPU: $GPU"
  rm -f "$TMPFILE"
  exit 1
fi

# --- header ---
printf "%-12s %-10s %-15s %-22s %-16s %-10s %-10s %-14s %s\n" \
  "CLUSTER" "NODE" "USER_ID" "FULL_NAME" "ADVISOR/PI" "RUNNING" "WALL_LIMIT" "GPU(used)" "JOB_NAME"
printf '%0.s-' {1..135}; echo

# --- step 2: per-node job lookup ---
# track printed jobs to avoid duplicates (same job appears via multiple partitions)
declare -A SEEN_JOB

while IFS='|' read cl node gputype total; do
  squeue -M "$cl" -h -w "$node" --state=RUNNING \
    -o "%i|%u|%a|%M|%l|%b|%j" 2>/dev/null | \
  while IFS='|' read jobid uid account runtime timelimit tres jobname; do
    [[ -z "$uid" ]] && continue
    key="${cl}:${jobid}"
    [[ -n "${SEEN_JOB[$key]}" ]] && continue
    SEEN_JOB[$key]=1

    user_info "$uid"
    # GPU count used: try specific type match first, fall back to any gpu count
    used=$(echo "$tres" | grep -oi "${gputype}:[0-9]*" | grep -oP '[0-9]+$')
    [[ -z "$used" ]] && used=$(echo "$tres" | grep -oP 'gpu[^:]*:\K[0-9]+' | head -1)
    [[ -z "$used" ]] && used="1"

    printf "%-12s %-10s %-15s %-22s %-16s %-10s %-10s %-14s %s\n" \
      "$cl" "$node" "$uid" \
      "${USER_NAME[$uid]:0:21}" "${USER_GROUP[$uid]:0:15}" \
      "$runtime" "$timelimit" "${gputype}x${used}" \
      "${jobname:0:35}"
  done
done < "$TMPFILE"

rm -f "$TMPFILE"

# --- step 3: summary sorted by total GPU count ---
echo ""
echo "=== Total GPU allocation per user (all clusters) ==="
printf "%-15s %-24s %-16s %6s\n" "USER_ID" "FULL_NAME" "ADVISOR/PI" "GPUs"
printf '%0.s-' {1..65}; echo

for cl in granite notchpeak kingspeak lonepeak; do
  squeue -M "$cl" -h --state=RUNNING -o "%u|%b" 2>/dev/null
done | grep -v "^$" \
  | awk -F'|' '{
      n = split($2, parts, ",")
      for (i=1; i<=n; i++) {
        if (match(parts[i], /gpu[^:]*:([0-9]+)/, m)) { totals[$1] += m[1]; break }
      }
    }
    END { for (u in totals) print totals[u], u }' \
  | sort -rn \
  | while read count uid; do
      user_info "$uid"
      printf "%-15s %-24s %-16s %6s\n" \
        "$uid" "${USER_NAME[$uid]:0:23}" "${USER_GROUP[$uid]:0:15}" "$count"
    done
