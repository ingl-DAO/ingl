import { createTheme } from "@mui/material/styles";
import React from "react";

// thin: 100
// extraLight: 200
// light: 300
// regular: 400
// medium: 500
// semiBold: 600
// bold: 700
// extraBold: 800
// black: 900
// 16px => 1rem

declare module "@mui/material/styles" {
  interface Theme {
    common: {
      line: React.CSSProperties["color"];
      inputBackground: React.CSSProperties["color"];
      adminElement: React.CSSProperties["color"];
      background: React.CSSProperties["color"];
      adminBackground: React.CSSProperties["color"];
      offWhite: React.CSSProperties["color"];
      placeholder: React.CSSProperties["color"];
      label: React.CSSProperties["color"];
      body: React.CSSProperties["color"];
      titleActive: React.CSSProperties["color"];
      dialogBackground: React.CSSProperties["color"]
    };
  }
  interface ThemeOptions {
    common: {
      line: React.CSSProperties["color"];
      inputBackground: React.CSSProperties["color"];
      adminElement: React.CSSProperties["color"];
      background: React.CSSProperties["color"];
      adminBackground: React.CSSProperties["color"];
      offWhite: React.CSSProperties["color"];
      placeholder: React.CSSProperties["color"];
      label: React.CSSProperties["color"];
      body: React.CSSProperties["color"];
      titleActive: React.CSSProperties["color"];
      dialogBackground: React.CSSProperties["color"]
    };
  }
  interface TypographyVariants {
    h1: React.CSSProperties;
    h2: React.CSSProperties;
    h3: React.CSSProperties;
    body1: React.CSSProperties;
    body2: React.CSSProperties;
    caption: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    h1: React.CSSProperties;
    h2: React.CSSProperties;
    h3: React.CSSProperties;
    body1: React.CSSProperties;
    body2: React.CSSProperties;
    caption: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    h1: true;
    h2: true;
    h3: true;
    body1: true;
    body2: true;
    caption: true
  }
}

const PRIMARY = "#003566"
const LINE = "#D9D9D9"
const SECONDARY = "#02C39A"

const theme = createTheme({
  palette: {
    primary: {
      main: PRIMARY,
    },
    secondary: {
      main: SECONDARY,
    },
    error: {
      main: "#EF233C",
    },
    success: {
      main: SECONDARY,
    },
  },
  common: {
    line: LINE,
    inputBackground: "#F4F5F7",
    background: "#0D203B",
    adminBackground: "#131313",
    adminElement: "#1D1D1D",
    offWhite: "#726F6F",
    placeholder: LINE,
    label: LINE,
    body: "#FFFFFF",
    titleActive: PRIMARY,
    dialogBackground: "#626262"
  },
  typography: {
    fontFamily: [
      "Berlin Sans FB",
      "Montserrat",
      "Roboto",
      "serif",
    ].join(","),
    h1: {
      fontSize: "2.8125rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 500,
    },
    h3: {
      fontSize: "1.5625rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1.125rem",
      fontWeight: 400,
    },
    body2: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    caption: {
      fontSize: "0.725rem",
      fontWeight: 300,
      color: "#828282"
    },
  },
});

export default theme;
