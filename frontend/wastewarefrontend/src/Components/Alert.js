import { Box, Slide, Alert, Snackbar } from "@mui/material";

const AlertSnackbar = ({
  anchorOrigin = { vertical: "bottom", horizontal: "center" },
  open,
  onClose,
  autoHideDuration = 2000,
  message,
  severity = "success",
}) => {
  return (
    <Snackbar
      anchorOrigin={anchorOrigin}
      open={open}
      onClose={onClose}
      autoHideDuration={autoHideDuration}
      slots={{ transition: Slide }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: 370,
          fontSize: 16,
          fontWeight: "bold",
          borderRadius: 5,
          display: "flex",
          justifyContent: "center", // center horizontally
          alignItems: "center", // center vertically if needed
          textAlign: "center",
        }}
      >
        <Box sx={{ width: "100%", textAlign: "center" }}>{message}</Box>
      </Alert>
    </Snackbar>
  );
};
export default AlertSnackbar;
