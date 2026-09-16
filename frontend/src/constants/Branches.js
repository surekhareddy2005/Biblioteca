// Single source of truth for branch/department options, so the student
// self-registration form (Login.jsx), the admin "Register Student" form
// (StudentsPage.jsx), and the book catalog form (BooksPage.jsx) all offer
// the exact same dropdown choices and stay in sync with the Student model's
// `branch` enum in the backend.

export const BRANCH_OPTIONS = [
  'CSE',
  'CSE-AIML',
  'CSE-DS',
  'CSE-CS',
  'IT',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL',
];

// Books aren't restricted to a single academic department - they can also
// belong to general-interest library categories that no student would ever
// have as their branch, so those are added here only.
export const BOOK_EXTRA_CATEGORIES = [
  'Spiritual',
  'Stories',
  'Competitive Exams',
];

export const BOOK_BRANCH_OPTIONS = ['General', ...BRANCH_OPTIONS, ...BOOK_EXTRA_CATEGORIES];