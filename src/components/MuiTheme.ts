import { createTheme, type ThemeOptions, ThemeProvider } from '@mui/material/styles';

const themeDef: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff', // Pure white
      dark: '#e0e0e0', // Light gray
      light: '#f5f5f5', // Very light gray
      contrastText: '#000000', // Black text for primary (white) buttons
    },
    secondary: {
      main: '#b0b0b0', // Medium gray
      dark: '#8a8a8a', // Darker gray
      light: '#d1d1d1', // Lighter gray
    },
    background: {
      default: '#121212', // Very dark (almost black)
      paper: '#1e1e1e', // Dark gray for cards/surfaces
    },
    text: {
      primary: '#ffffff', // White
      secondary: '#b0b0b0', // Medium gray
    },
    success: {
      main: '#e0e0e0', // Light gray
    },
    warning: {
      main: '#a0a0a0', // Gray
    },
    error: {
      main: '#d4d4d4', // Light gray
    },
    info: {
      main: '#909090', // Medium-dark gray
    },
    divider: 'rgba(255, 255, 255, 0.12)', // Subtle divider
    action: {
      disabled: '#5c5c5c', // Darker gray for disabled elements
      disabledBackground: '#2d2d2d', // Very dark gray for disabled backgrounds
      disabledOpacity: 0.7, // Increase opacity to make disabled state more obvious
      hover: 'rgba(255, 255, 255, 0.08)', // Subtle hover effect
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 300, // Lighter weight for headings
    },
    h2: {
      fontWeight: 300,
    },
    h3: {
      fontWeight: 400,
    },
    button: {
      textTransform: 'none', // No uppercase text transform
    },
  },
  shape: {
    borderRadius: 4, // Slightly rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&.Mui-disabled': {
            color: '#5c5c5c', // Darker text for disabled button
            backgroundColor: '#2d2d2d', // Very dark background for disabled
            cursor: 'not-allowed',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: '#e0e0e0', // Light gray on hover for white buttons
          },
          '&.MuiButton-containedPrimary': {
            color: '#000000', // Ensure text is black on primary (white) buttons
            '&:hover': {
              color: '#000000', // Keep text black when hovering
            },
          },
        },
        outlined: {
          '&.Mui-disabled': {
            borderColor: '#3d3d3d', // Darker border for disabled outlined button
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: '#5c5c5c', // Darker color for disabled icon buttons
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: '#5c5c5c', // Darker color for disabled inputs
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3d3d3d', // Darker border for disabled inputs
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: '#5c5c5c', // Darker color for disabled checkboxes
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            '& .MuiSwitch-track': {
              backgroundColor: '#3d3d3d !important', // Darker track for disabled switches
            },
            '& .MuiSwitch-thumb': {
              backgroundColor: '#5c5c5c', // Darker thumb for disabled switches
            },
          },
        },
      },
    },
  },
};

export const MuiTheme = createTheme(themeDef);
