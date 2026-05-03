import Papa from "papaparse";

const normalizeWhitespace = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const parseJson = (raw: string) => {
  const data = JSON.parse(raw);
  return normalizeWhitespace(JSON.stringify(data, null, 2));
};

const parseCsv = (raw: string) => {
  const parsed = Papa.parse<string[]>(raw, { skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "CSV 解析失败");
  }

  const rows = parsed.data;
  return normalizeWhitespace(rows.map((row) => row.join(" | ")).join("\n"));
};

export const parseByFileType = (filename: string, raw: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (!raw.trim()) {
    throw new Error("文件为空");
  }

  switch (ext) {
    case "txt":
    case "md":
      return normalizeWhitespace(raw);
    case "json":
      return parseJson(raw);
    case "csv":
      return parseCsv(raw);
    default:
      throw new Error(`不支持的文件类型: ${ext ?? "unknown"}`);
  }
};
