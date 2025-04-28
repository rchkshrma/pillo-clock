import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from "./pushNotifications";

const Subscribe = () => {
  const navigate = useNavigate();
  const pushNotifications = usePushNotifications();  

  useEffect(() => {
    navigate('/account');
  }, [pushNotifications, navigate]);

  return null;
};

export default Subscribe;
