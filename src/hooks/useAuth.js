import { useAppContext } from '../context/AppContext';

const useAuth = () => {
  const { state } = useAppContext();
  return {
    user: state.user,
    userProfile: state.userProfile,
    initializing: state.initializing
  };
};

export default useAuth;