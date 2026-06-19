import { parse } from "csv-parse/sync";

export interface UserImportRow {
  email: string;
  name: string;
  department?: string;
}

export interface AssignmentImportRow {
  building?: string;
  floor?: string;
  markerNumber: string;
  userEmail: string;
}

export function parseUserCSV(content: string): {
  rows: UserImportRow[];
  errors: string[];
} {
  const rows: UserImportRow[] = [];
  const errors: string[] = [];

  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    records.forEach((record: any, index: number) => {
      if (!record.email || !record.name) {
        errors.push(`Row ${index + 2}: Missing email or name`);
        return;
      }

      rows.push({
        email: record.email.trim(),
        name: record.name.trim(),
        department: record.department?.trim() || undefined,
      });
    });
  } catch (err: any) {
    errors.push(`CSV parsing error: ${err.message}`);
  }

  return { rows, errors };
}

export function parseAssignmentCSV(content: string): {
  rows: AssignmentImportRow[];
  errors: string[];
} {
  const rows: AssignmentImportRow[] = [];
  const errors: string[] = [];

  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    records.forEach((record: any, index: number) => {
      if (!record.markerNumber) {
        errors.push(`Row ${index + 2}: Missing marker number`);
        return;
      }

      if (record.userEmail && record.userEmail.trim()) {
        rows.push({
          building: record.building?.trim(),
          floor: record.floor?.trim(),
          markerNumber: record.markerNumber.trim(),
          userEmail: record.userEmail.trim(),
        });
      }
    });
  } catch (err: any) {
    errors.push(`CSV parsing error: ${err.message}`);
  }

  return { rows, errors };
}
