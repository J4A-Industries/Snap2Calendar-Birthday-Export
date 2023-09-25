import { createTheme, type ThemeOptions, ThemeProvider } from '@mui/material/styles';

const themeDef: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#d926a9', // This is a lighter variant of the previous color
    },
    secondary: {
      main: '#8a56e2',
    },
    background: {
      default: '#1d232a',
      paper: '#2a323c',
    },
    text: {
      primary: '#ffffff', // Adjusted this to white color
    },
    success: {
      main: '#36d399',
    },
    warning: {
      main: '#fbbd23',
    },
    error: {
      main: '#f87272',
    },
    info: {
      main: '#1fb2a6',
    },
  },
};

export const MuiTheme = createTheme(themeDef);
