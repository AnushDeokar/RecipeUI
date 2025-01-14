import { parse } from "json5";

const QUOTE_CHARS = ["'", '"'];
function splitStringManual(_str: string) {
  const str = _str.trim();
  let words: string[] = [];
  let builder: string = "";
  let buildingString = false;

  let i = 0;

  function addWord() {
    if (buildingString) {
      buildingString = false;

      words.push(builder.slice(1, -1).trim());
      builder = "";
    } else {
      words.push(builder.trim());
      builder = "";
    }
  }

  while (i < str.length) {
    const char = str[i];
    if (char === " " || char === "\\") {
      if (!builder) {
        i++;
        continue;
      }

      const isStillBuildingString =
        buildingString && !QUOTE_CHARS.includes(builder[builder.length - 1]);

      if (isStillBuildingString) {
        builder += char;
        i++;
        continue;
      }

      addWord();
    } else if (QUOTE_CHARS.includes(char)) {
      buildingString = true;
      builder += char;
    } else {
      builder += char;
    }
    i++;
  }

  if (builder) {
    addWord();
  }

  return words.filter((word) => {
    if (word.startsWith("\\") || word.startsWith("\n")) {
      return false;
    }

    return true;
  });
}

export interface CurlRequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
}

function parsePartsToCurl(parts: string[]) {
  let result: CurlRequestInfo = {
    method: "GET", // Default method
    url: "",
    headers: {},
    body: null,
  };

  for (let i = 0; i < parts.length; i++) {
    switch (parts[i].toLowerCase()) {
      case "curl":
        // Skip the curl keyword itself.
        break;
      case "-x":
      case "--request":
        result.method = parts[i + 1];
        i++; // Skip the next item which is the actual method.
        break;
      case "-g":
      case "--get":
        result.method = "GET";
        break;
      case "-h":
      case "--header":
        const str = parts[i + 1];
        const index = str.indexOf(":");

        const headerParts = [
          str.substring(0, index).trim(),
          str.substring(index + 1).trim(),
        ];

        const [header, key] = headerParts;
        result.headers[header] = key;
        i++; // Skip the next item which is the actual header.
        break;
      case "-d":
      case "--data":
        try {
          result.body = parse(parts[i + 1]);
          result.method = "POST";
        } catch (e) {
          console.error("Unable to parse body", parts[i + 1]);
        }
        i++; // Skip the next item which is the actual body.
        break;

      // TODO: Add case for location
      case "--url":
      case "--location":
        result.url = parts[i + 1];
        i++; // Skip the next item which is the actual url.
        break;
      default:
        // Assume this is the URL if it's not recognized as a flag or flag value.
        if (!result.url && !parts[i].startsWith("-")) {
          result.url = parts[i];
        }
        break;
    }
  }

  return result;
}

export function parseCurl(curlString: string): CurlRequestInfo {
  const parts = splitStringManual(curlString);
  const result = parsePartsToCurl(parts);
  return result;
}
