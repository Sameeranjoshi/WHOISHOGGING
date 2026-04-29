#!/usr/bin/env python3
from data_sync import sync_data


def main() -> None:
    result = sync_data()
    print(
        "Updated docs/data from exact script outputs: "
        f"{result['free_rows']} free rows, "
        f"{result['hogging_rows']} hogging rows, "
        f"generated_at={result['generated_at']}"
    )


if __name__ == "__main__":
    main()
