export const BRANCH_OPTIONS = [
  { value: "CSE", label: "Computer Science & Engineering (CSE)" },
  { value: "IT", label: "Information Technology (IT)" },
  { value: "ECE", label: "Electronics & Communication Engineering (ECE)" },
  { value: "AI&DS", label: "Artificial Intelligence & Data Science (AI&DS)" },
  { value: "EE", label: "Electrical Engineering (EE)" },
  { value: "ME", label: "Mechanical Engineering (ME)" },
  { value: "CE", label: "Civil Engineering (CE)" },
  { value: "MT", label: "Metallurgical Engineering (MT)" },
  { value: "IP", label: "Industrial & Production Engineering (IP)" },
] as const;

export type BranchCode = (typeof BRANCH_OPTIONS)[number]["value"];

export const BRANCH_LABELS = Object.fromEntries(
  BRANCH_OPTIONS.map((branch) => [branch.value, branch.label])
) as Record<BranchCode, string>;
