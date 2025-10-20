from __future__ import annotations

from typing import List, Dict, Any

from app.core.data_manager_factory import create_data_manager
from app.schemas.query import DataSource


class SchemaDiscoveryService:
    """
    Reusable service that connects to a data source, discovers its schema as a flat list,
    and produces processed artifacts ready to persist in Supabase:
      - schema_json: structured JSON for UX tree rendering
      - schema_elements_flat: the original flat list of schema elements
      - is_large: boolean flag based on rough token count of the full schema text
    """

    def _format_schema_for_ux(self, elements: List[str], typed: List[Dict[str, str]] | None = None) -> List[Dict[str, Any]]:
        """
        Convert a flat list of elements into a nested structure grouped by schema, then tables.

        Input examples:
          - DB style:    "city.district_metrics.population"
          - File style:  "orders.amount" (no schema present)

        Output shape:
        [
          {
            "schema_name": "city",
            "tables": [
              {"table_name": "district_metrics", "columns": ["population", ...]}
            ]
          },
          ...
        ]
        """
        # Group columns by (schema, table)
        by_schema_table: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}

        # Build a lookup for types: key = schema.table.column -> type
        types_map: Dict[str, str] = {}
        if typed:
            for row in typed:
                sch = row.get("schema") or "public"
                tbl = row.get("table") or ""
                col = row.get("column") or ""
                typ = row.get("type") or ""
                key = f"{sch}.{tbl}.{col}" if sch and tbl else (f"{tbl}.{col}" if tbl else col)
                types_map[key] = typ

        for el in elements:
            parts = el.split(".")
            if len(parts) < 2:
                # Unexpected format; skip
                continue
            if len(parts) == 2:
                # No schema specified (file sources). Assume 'public' as default schema.
                schema_name = "public"
                table_name = parts[0]
                column = parts[1]
            else:
                schema_name = parts[0]
                table_name = ".".join(parts[1:-1]) if len(parts) > 3 else parts[1]
                column = parts[-1]

            key = f"{schema_name}.{table_name}.{column}" if schema_name and table_name else f"{table_name}.{column}"
            col_entry: Dict[str, Any] = {"name": column}
            if key in types_map and types_map[key]:
                col_entry["type"] = types_map[key]
            by_schema_table.setdefault(schema_name, {}).setdefault(table_name, []).append(col_entry)

        # Build nested list, sorted for stable UI
        result: List[Dict[str, Any]] = []
        for schema_name in sorted(by_schema_table.keys()):
            tables_map = by_schema_table[schema_name]
            tables_list = []
            for table_name in sorted(tables_map.keys()):
                # Ensure stable and unique columns by name
                seen = set()
                items = []
                for c in tables_map[table_name]:
                    nm = c.get("name") if isinstance(c, dict) else str(c)
                    if nm in seen:
                        continue
                    seen.add(nm)
                    items.append(c)
                # Sort by name
                items_sorted = sorted(items, key=lambda x: (x.get("name") if isinstance(x, dict) else str(x)))
                tables_list.append({"table_name": table_name, "columns": items_sorted})
            result.append({"schema_name": schema_name, "tables": tables_list})

        return result

    def _format_schema_for_llm(self, elements: List[str]) -> str:
        """
        Convert a flat list into a compact, human-readable schema text for LLM prompting.
        Matches the style used elsewhere in the codebase.
        """
        from collections import defaultdict

        tables = defaultdict(list)
        for el in elements:
            parts = el.split(".")
            if len(parts) < 2:
                continue
            column = parts[-1]
            table = ".".join(parts[:-1])
            tables[table].append(column)

        lines: List[str] = []
        for table, cols in tables.items():
            lines.append(f"Table {table} has columns: {', '.join(cols)}")
        return "\n".join(lines).strip()

    def _count_tokens(self, text: str) -> int:
        """Rough token counter using whitespace split for now."""
        return len(text.split()) if text else 0

    def discover_and_process_schema(self, source: DataSource) -> Dict[str, Any]:
        """
        Connect to the data source, fetch flat schema, and produce artifacts.

        Returns a dict with keys: schema_json, schema_elements_flat, is_large.
        """
        # Build manager from provided DataSource
        manager = create_data_manager(source)

        # 1) Discover flat schema list
        schema_elements_flat = manager.get_schema_elements()

        # Attempt to get typed columns (optional per manager)
        typed_rows = []
        try:
            typed_rows = manager.get_schema_columns_with_types() or []
        except Exception:
            typed_rows = []

        # 2) Build UX JSON (use types if available)
        schema_json = self._format_schema_for_ux(schema_elements_flat, typed_rows)

        # 3) Build full schema text for token counting
        full_schema_text = self._format_schema_for_llm(schema_elements_flat)
        token_count = self._count_tokens(full_schema_text)
        is_large = token_count > 3000

        return {
            "schema_json": schema_json,
            "schema_elements_flat": schema_elements_flat,
            "is_large": is_large,
        }
