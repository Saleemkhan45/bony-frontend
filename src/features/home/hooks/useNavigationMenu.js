import { useEffect, useState } from 'react';

function useNavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen((currentValue) => !currentValue);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const handleChange = (event) => {
      if (event.matches) {
        closeMenu();
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty('overflow');
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [isOpen]);

  return {
    isOpen,
    closeMenu,
    toggleMenu,
  };
}

export default useNavigationMenu;
