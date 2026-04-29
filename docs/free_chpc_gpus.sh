#!/usr/bin/env bash
# free_gpus.sh — list free GPU slots on CHPC partitions you can access
# Usage: ./free_gpus.sh [gpu_filter]   e.g.  ./free_gpus.sh h200
#                                            ./free_gpus.sh a100

FILTER="${1:-}"

# --- parse your allocations: partition -> account, qos ---
declare -A PART_ACCOUNT PART_QOS
while IFS= read -r line; do
  part=$(echo "$line" | grep -oP '(?<=--partition=)\S+')
  acct=$(echo "$line" | grep -oP '(?<=--account=)\S+')
  qos=$( echo "$line" | grep -oP '(?<=--qos=)\S+')
  [[ -n "$part" && -n "$acct" ]] && PART_ACCOUNT["$part"]="$acct" && PART_QOS["$part"]="$qos"
done < <(mychpc batch 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | grep -i '\bgpu\b')

[[ ${#PART_ACCOUNT[@]} -eq 0 ]] && { echo "No GPU partitions found in your allocations."; exit 1; }

# --- header ---
printf "\n%-12s %-28s %-10s %-8s %-8s %-12s %-24s %-20s %s\n" \
  "CLUSTER" "PARTITION" "NODE" "FREE" "CORES" "MAX_TIME" "GPU_TYPE" "ACCOUNT" "QOS"
printf '%0.s-' {1..145}; echo

# derive cluster from node prefix
node_cluster() {
  case "$1" in
    grn*) echo granite ;;
    notch*) echo notchpeak ;;
    kp*) echo kingspeak ;;
    lp*) echo lonepeak ;;
    *) echo unknown ;;
  esac
}

# query each cluster separately to get correct cluster name
for cluster in granite notchpeak kingspeak lonepeak; do
  sinfo -M "$cluster" -h -N -o "%N|%G|%T|%P|%c|%l" 2>/dev/null \
    | grep -v "^$" \
    | sort -u \
    | awk -F'|' 'tolower($2) ~ /gpu/ && ($3 != "allocated" && $3 != "alloc" && $3 != "down" && $3 != "drain" && $3 != "maint" && $3 != "comp")' \
    | while IFS='|' read node gres state part cores timelimit; do

        # only show partitions we have access to
        [[ -z "${PART_ACCOUNT[$part]}" ]] && continue

        # parse each gpu:TYPE:COUNT entry, skip MIG sub-slices
        echo "$gres" | tr ',' '\n' | grep -oP 'gpu:[^:(]+:[0-9]+(?=\()' | while read gpuentry; do
          gputype=$(echo "$gpuentry" | awk -F: '{print $2}')
          total=$(echo "$gpuentry"   | awk -F: '{print $3}')

          # apply optional gpu filter
          [[ -n "$FILTER" ]] && echo "$gputype" | grep -qiv "$FILTER" && continue

          # count allocated GPUs on this node from squeue
          alloc=$(squeue -M "$cluster" -h -w "$node" -o "%b" 2>/dev/null \
            | awk -F: '{print $NF}' | grep -E '^[0-9]+$' | paste -sd+ \
            | bc 2>/dev/null)
          [[ -z "$alloc" ]] && alloc=0
          free=$(( total - alloc ))
          [[ "$free" -le 0 ]] && continue

          acct="${PART_ACCOUNT[$part]:-?}"
          qos="${PART_QOS[$part]:-?}"

          printf "%-12s %-28s %-10s %-8s %-8s %-12s %-24s %-20s %s\n" \
            "$cluster" "$part" "$node" "${free}/${total}" \
            "$cores" "$timelimit" "$gputype" "$acct" "$qos"
        done
    done
done

echo ""
echo "To allocate (interactive):"
echo "  srun --cluster=<CLUSTER> --partition=<PARTITION> --account=<ACCOUNT> --qos=<QOS> \\"
echo "       --nodes=1 --ntasks=1 --cpus-per-task=4 --gres=gpu:<GPU_TYPE>:1 \\"
echo "       --time=1:00:00 --mem=32G --pty bash"
