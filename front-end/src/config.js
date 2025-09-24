export const config = {
  ABLY_KEY: import.meta.env.VITE_ABLY_KEY,
};


//Used to import VITE environment variable key to ABLY key for use in the code.

//used for mock user names (change later to logged in user)  in cursor tracking

export const mockNames = ["Dane Mills", "Sam Mason", "Najla Karam"];

export const colors = [
  { cursorColor: "#6366f1" },
  { cursorColor: "#8b5cf6" },
  { cursorColor: "#ec4899" },
];

