#!/usr/bin/env bash
# whoishogging.sh - show active GPU jobs and summarize usage by user
# Usage:
#   ./whoishogging.sh
#   ./whoishogging.sh notchpeak
#   ./whoishogging.sh owner-gpu-guest
#   ./whoishogging.sh u1234567

FILTER="${1:-}"
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

gpu_count() {
  local gres="$1"
  local count
  count=$(echo "$gres" | grep -oE 'gpu:[^:,()]+:[0-9]+' | awk -F: '{sum += $3} END {print sum + 0}')
  echo "${count:-0}"
}

for cluster in granite notchpeak kingspeak lonepeak; do
  squeue -M "$cluster" -h -o "%u|%a|%P|%N|%b|%M|%l|%T|%i|%j" 2>/dev/null \
    | while IFS='|' read -r user acct part node gres runtime timelimit state jobid jobname; do
        [[ "$state" == "PD" ]] && continue
        gpus=$(gpu_count "$gres")
        [[ "$gpus" -eq 0 && ! "$part" =~ gpu ]] && continue

        row="$cluster|$user|$acct|$part|$node|$gpus|$runtime|$timelimit|$state|$jobid|$jobname|$gres"
        if [[ -n "$FILTER" ]] && ! echo "$row" | grep -qi -- "$FILTER"; then
          continue
        fi
        echo "$row" >> "$TMPFILE"
      done
done

if [[ ! -s "$TMPFILE" ]]; then
  if [[ -n "$FILTER" ]]; then
    echo "No active GPU jobs matched filter: $FILTER"
  else
    echo "No active GPU jobs found."
  fi
  exit 0
fi

printf "\n%-10s %-10s %-20s %-28s %-12s %-6s %-10s %-12s %-8s %-10s %s\n" \
  "CLUSTER" "USER" "ACCOUNT" "PARTITION" "NODE" "GPUS" "RUNTIME" "LIMIT" "STATE" "JOBID" "JOB_NAME"
printf '%0.s-' {1..150}
echo

sort -t'|' -k6,6nr -k2,2 "$TMPFILE" | while IFS='|' read -r cluster user acct part node gpus runtime timelimit state jobid jobname gres; do
  printf "%-10s %-10s %-20s %-28s %-12s %-6s %-10s %-12s %-8s %-10s %s\n" \
    "$cluster" "$user" "$acct" "$part" "$node" "$gpus" "$runtime" "$timelimit" "$state" "$jobid" "$jobname"
done

echo
echo "Summary by user:"
printf "%-10s %-6s %-6s %s\n" "USER" "JOBS" "GPUS" "PARTITIONS"
printf '%0.s-' {1..80}
echo

awk -F'|' '
{
  jobs[$2]++
  gpus[$2] += $6
  if (!seen[$2 SUBSEP $4]++) {
    parts[$2] = parts[$2] ? parts[$2] "," $4 : $4
  }
}
END {
  for (user in jobs) {
    printf "%s|%d|%d|%s\n", user, jobs[user], gpus[user], parts[user]
  }
}
' "$TMPFILE" | sort -t'|' -k3,3nr -k2,2nr | while IFS='|' read -r user jobs gpus parts; do
  printf "%-10s %-6s %-6s %s\n" "$user" "$jobs" "$gpus" "$parts"
done

echo
echo "Tip: filter by cluster, user, account, partition, or node:"
echo " ./whoishogging.sh notchpeak"
echo " ./whoishogging.sh owner-gpu-guest"
echo " ./whoishogging.sh u1234567"
