export const STATUSES = [
  "Draft",
  "Pending Approval",
  "Approved - Awaiting ICT",
  "Accepted by ICT",
  "In Analysis",
  "In Development",
  "In Testing",
  "Deployed",
  "Coordinator Accepted",
  "Accepted - Closed",
  "Rework",
  "Rejected by ICT",
  "Paused",
  "Killed",
];

// Who can set each status
export const STATUS_SET_BY = {
  "Draft":                    "System",
  "Pending Approval":         "System",
  "Approved - Awaiting ICT":  "System (after Director approves)",
  "Accepted by ICT":          "ICT",
  "In Analysis":              "ICT",
  "In Development":           "ICT",
  "In Testing":               "ICT",
  "Deployed":                 "ICT",
  "Coordinator Accepted":     "Academic Coordinator",
  "Accepted - Closed":        "Director ACAD (final approval)",
  "Rework":                   "Academic Coordinator / Director ACAD",
  "Rejected by ICT":          "ICT",
  "Paused":                   "Academic Coordinator / Director / ICT",
  "Killed":                   "Director ACAD / Pro Rector",
};

// Valid next statuses from each status (for dropdown/transition logic)
export const VALID_TRANSITIONS = {
  "Draft":                    ["Pending Approval"],
  "Pending Approval":         ["Approved - Awaiting ICT", "Draft", "Killed"],
  "Approved - Awaiting ICT":  ["Accepted by ICT", "Rejected by ICT", "Paused", "Killed"],
  "Accepted by ICT":          ["In Analysis", "Paused", "Killed"],
  "In Analysis":              ["In Development", "Paused", "Killed"],
  "In Development":           ["In Testing", "Paused", "Killed"],
  "In Testing":               ["Deployed", "In Development", "Paused", "Killed"],
  "Deployed":                 ["Coordinator Accepted", "Rework", "Paused", "Killed"],
  "Coordinator Accepted":     ["Accepted - Closed", "Rework", "Killed"],
  "Rework":                   ["In Development", "Paused", "Killed"],
  "Rejected by ICT":          ["Draft", "Killed"],
  "Paused":                   ["In Analysis", "In Development", "In Testing", "Killed"],
  "Accepted - Closed":        [],
  "Killed":                   [],
};

export const REQUEST_TYPES = [
  "New Development",
  "Enhancement",
  "Bug Fix",
  "Policy Change",
];

export const PRIORITIES = ["Critical", "High", "Medium", "Low"];
