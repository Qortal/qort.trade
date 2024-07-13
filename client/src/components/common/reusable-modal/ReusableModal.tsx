import {
  ReusableModalBackdrop,
  ReusableModalContainer,
  ReusableModalSubContainer,
} from "./ReusableModal-styles";
interface ReusableModalProps {
  backdrop?: boolean;
  children: React.ReactNode;
}

export const ReusableModal: React.FC<ReusableModalProps> = ({ backdrop, children }) => {
  return (
    <>
      <ReusableModalContainer>
        <ReusableModalSubContainer>{children}</ReusableModalSubContainer>
      </ReusableModalContainer>
      {backdrop && <ReusableModalBackdrop />}
    </>
  );
};
