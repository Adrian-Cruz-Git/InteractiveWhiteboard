

  // helper function to map Firebase errors
  export const getFriendlyError = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/popup-closed-by-user":
        return "The Google login popup was closed before completing sign in.";
      case "auth/missing-password":
        return "Please enter a password";
      case "auth/invalid-credential":
        return "Username or password is invalid";
      default:
        return "Something went wrong. Please try again.";
    }
  };