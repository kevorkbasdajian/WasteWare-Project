import { Modal } from "@mui/material";

const Modalwindow = ({ children, open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      {children}
    </Modal>
  );
};
export default Modalwindow;
