import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * 一个自定义Hook，用于监听Firebase的认证状态。
 * @returns {{user: object|null, initializing: boolean}} 
 * - user: 当前登录的用户对象，如果未登录则为null。
 * - initializing: 一个布尔值，如果仍在检查初始认证状态，则为true。
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 获取Firebase auth实例
    const auth = getAuth();
    
    // 设置一个监听器，当用户的登录状态改变时，Firebase会调用这个函数
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // 更新我们的user状态
      setUser(user); 
      
      // 在第一次检查完成后，将initializing设为false
      if (initializing) {
        setInitializing(false);
      }
    });

    // 清理函数：当组件被卸载时，取消这个监听，以防止内存泄漏
    return unsubscribe;
  }, []); // 空依赖数组意味着这个useEffect只在组件首次挂载时运行一次

  // 将用户状态和初始化状态返回给使用此Hook的组件
  return { user, initializing };
};

export default useAuth;
