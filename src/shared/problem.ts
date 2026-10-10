/** RFC 9457 problem details, returned for every API error. */
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  requestId?: string;
};

export const problem = (status: number, title: string, detail?: string): ProblemDetails => ({
  type: "about:blank",
  title,
  status,
  ...(detail ? { detail } : {}),
});
