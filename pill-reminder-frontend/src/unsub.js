import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { unsub } from "./pushNotifications";

const Unsub = () => {
  const navigate = useNavigate();
  const pushNotifications = unsub();  

  useEffect(() => {
    navigate('/account');
  }, [pushNotifications, navigate]);

  return null;
};

export default Unsub;
