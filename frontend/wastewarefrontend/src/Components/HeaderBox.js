import React from "react";

const HeaderBox = ({ text, gradientColors, color = "black" }) => {
  // Determine if gradientColors is a CSS variable (starts with --) or an array
  const getBackgroundStyle = () => {
    // If it's a string starting with --, treat it as a CSS variable
    if (typeof gradientColors === "string" && gradientColors.startsWith("--")) {
      return `var(${gradientColors})`;
    }

    // If it's a string but not a CSS variable, use it directly
    if (typeof gradientColors === "string") {
      return gradientColors;
    }

    // If it's an array, create gradient from colors
    if (Array.isArray(gradientColors)) {
      return `linear-gradient(to bottom right, ${gradientColors.join(", ")})`;
    }

    // Fallback
    return "linear-gradient(to bottom right, #6a46ff, #5623be)";
  };

  const gradientStyle = {
    background: getBackgroundStyle(),
    padding: "30px 20px",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "2.0rem",
    fontWeight: "bold",
    textAlign: "center",
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
  };

  return <div style={gradientStyle}>{text}</div>;
};

export default HeaderBox;
