import React from "react";

const HeaderBox = ({ text, gradientColors, color = "black" }) => {
  const gradientStyle = {
    // background: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
    background: `linear-gradient(to bottom right, ${gradientColors.join(
      ", "
    )})`,

    padding: "30px 20px",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "2.0rem",
    fontWeight: "bold",
    textAlign: "center",
  };

  return <div style={gradientStyle}>{text}</div>;
};

export default HeaderBox;
