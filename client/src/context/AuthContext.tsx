import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api, User } from '../services/api';

type MarketplaceMode = 'BUYER' | 'SELLER';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<User>;

  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    college_id: string;
    marketplace_mode?: MarketplaceMode;
  }) => Promise<User>;

  logout: () => void;

  refreshUser: () => Promise<void>;

  marketplaceMode: MarketplaceMode;

  setMarketplaceMode: (
    mode: MarketplaceMode
  ) => Promise<void>;

  selectedCollegeId: string | null;

  setSelectedCollegeId: (
    id: string | null
  ) => void;

  resetToHomeCollege: () => void;

  isBrowsingOtherCollege: boolean;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeMarketplaceMode = (
  mode: unknown
): MarketplaceMode => {
  return mode === 'SELLER'
    ? 'SELLER'
    : 'BUYER';
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  /*
  |--------------------------------------------------------------------------
  | AUTH STATE
  |--------------------------------------------------------------------------
  */

  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(() =>
      localStorage.getItem(
        'campusmart_token'
      )
    );

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  /*
  |--------------------------------------------------------------------------
  | MARKETPLACE MODE
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | This is now REAL React state.
  |
  | Previously the mode was calculated directly from:
  |
  | user.marketplace_mode
  |
  | That could cause parts of the UI to remain stale.
  |
  | Now:
  |
  | Settings
  |      ↓
  | setMarketplaceMode()
  |      ↓
  | marketplaceMode React state changes
  |      ↓
  | Navbar / Profile / other components re-render
  |
  */

  const [
    marketplaceMode,
    setMarketplaceModeState,
  ] = useState<MarketplaceMode>(() => {
    const saved =
      localStorage.getItem(
        'campusmart_marketplace_mode'
      );

    return normalizeMarketplaceMode(saved);
  });

  /*
  |--------------------------------------------------------------------------
  | COLLEGE BROWSING STATE
  |--------------------------------------------------------------------------
  */

  const [
    guestCollegeId,
    setGuestCollegeId,
  ] = useState<string | null>(() =>
    localStorage.getItem(
      'campusmart_guest_college'
    )
  );

  const [
    browsingCollegeId,
    setBrowsingCollegeId,
  ] = useState<string | null>(() =>
    localStorage.getItem(
      'campusmart_browsing_college'
    )
  );

  /*
  |--------------------------------------------------------------------------
  | RESTORE LOGIN SESSION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const initAuth = async () => {
      const storedToken =
        localStorage.getItem(
          'campusmart_token'
        );

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData =
          await api.getMe();

        setUser(userData);

        setToken(storedToken);

        /*
        |--------------------------------------------------------------------------
        | Restore marketplace mode from backend
        |--------------------------------------------------------------------------
        */

        const backendMode =
          normalizeMarketplaceMode(
            userData.marketplace_mode
          );

        setMarketplaceModeState(
          backendMode
        );

        localStorage.setItem(
          'campusmart_marketplace_mode',
          backendMode
        );

      } catch (err) {

        console.error(
          'Failed to restore session:',
          err
        );

        localStorage.removeItem(
          'campusmart_token'
        );

        localStorage.removeItem(
          'campusmart_marketplace_mode'
        );

        setToken(null);

        setUser(null);

        setMarketplaceModeState(
          'BUYER'
        );
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  const login = async (
    email: string,
    password: string
  ): Promise<User> => {

    const res =
      await api.login({
        email,
        password,
      });

    const loggedInUser =
      res.data.user;

    const authToken =
      res.data.token;

    /*
    |--------------------------------------------------------------------------
    | Save authentication
    |--------------------------------------------------------------------------
    */

    localStorage.setItem(
      'campusmart_token',
      authToken
    );

    setToken(authToken);

    setUser(loggedInUser);

    /*
    |--------------------------------------------------------------------------
    | Restore user's marketplace preference
    |--------------------------------------------------------------------------
    */

    const userMode =
      normalizeMarketplaceMode(
        loggedInUser.marketplace_mode
      );

    setMarketplaceModeState(
      userMode
    );

    localStorage.setItem(
      'campusmart_marketplace_mode',
      userMode
    );

    /*
    |--------------------------------------------------------------------------
    | Reset alternate campus browsing
    |--------------------------------------------------------------------------
    */

    localStorage.removeItem(
      'campusmart_browsing_college'
    );

    setBrowsingCollegeId(null);

    return loggedInUser;
  };

  /*
  |--------------------------------------------------------------------------
  | REGISTER
  |--------------------------------------------------------------------------
  */

  const register = async (
    payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      college_id: string;
      marketplace_mode?: MarketplaceMode;
    }
  ): Promise<User> => {

    const res =
      await api.register(payload);

    const registeredUser =
      res.data.user;

    const authToken =
      res.data.token;

    /*
    |--------------------------------------------------------------------------
    | Save authentication
    |--------------------------------------------------------------------------
    */

    localStorage.setItem(
      'campusmart_token',
      authToken
    );

    setToken(authToken);

    setUser(registeredUser);

    /*
    |--------------------------------------------------------------------------
    | Initial marketplace mode
    |--------------------------------------------------------------------------
    */

    const userMode =
      normalizeMarketplaceMode(
        registeredUser.marketplace_mode ??
          payload.marketplace_mode
      );

    setMarketplaceModeState(
      userMode
    );

    localStorage.setItem(
      'campusmart_marketplace_mode',
      userMode
    );

    /*
    |--------------------------------------------------------------------------
    | Reset campus browsing
    |--------------------------------------------------------------------------
    */

    localStorage.removeItem(
      'campusmart_browsing_college'
    );

    setBrowsingCollegeId(null);

    return registeredUser;
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = () => {

    localStorage.removeItem(
      'campusmart_token'
    );

    localStorage.removeItem(
      'campusmart_browsing_college'
    );

    localStorage.removeItem(
      'campusmart_marketplace_mode'
    );

    setToken(null);

    setUser(null);

    setBrowsingCollegeId(null);

    setMarketplaceModeState(
      'BUYER'
    );
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH USER
  |--------------------------------------------------------------------------
  */

  const refreshUser =
    async () => {

      if (!token) {
        return;
      }

      try {

        const userData =
          await api.getMe();

        setUser(userData);

        /*
        |--------------------------------------------------------------------------
        | Keep marketplace mode synchronized
        |--------------------------------------------------------------------------
        */

        const backendMode =
          normalizeMarketplaceMode(
            userData.marketplace_mode
          );

        setMarketplaceModeState(
          backendMode
        );

        localStorage.setItem(
          'campusmart_marketplace_mode',
          backendMode
        );

      } catch (err) {

        console.error(
          'Failed to refresh user:',
          err
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CHANGE MARKETPLACE MODE
  |--------------------------------------------------------------------------
  */

  const setMarketplaceMode =
    async (
      mode: MarketplaceMode
    ) => {

      /*
      |--------------------------------------------------------------------------
      | Save old mode for rollback
      |--------------------------------------------------------------------------
      */

      const previousMode =
        marketplaceMode;

      /*
      |--------------------------------------------------------------------------
      | OPTIMISTIC UPDATE
      |--------------------------------------------------------------------------
      |
      | Change UI immediately.
      |
      | This means Navbar / Profile / Settings
      | update instantly without waiting for API.
      */

      setMarketplaceModeState(
        mode
      );

      localStorage.setItem(
        'campusmart_marketplace_mode',
        mode
      );

      /*
      |--------------------------------------------------------------------------
      | Also update current user object
      |--------------------------------------------------------------------------
      */

      setUser((prev) => {

        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          marketplace_mode: mode,
        };
      });

      /*
      |--------------------------------------------------------------------------
      | Guest safety
      |--------------------------------------------------------------------------
      */

      if (!user) {
        return;
      }

      try {

        /*
        |--------------------------------------------------------------------------
        | Save preference to database
        |--------------------------------------------------------------------------
        */

        const res =
          await api.updateMarketplaceMode(
            mode
          );

        /*
        |--------------------------------------------------------------------------
        | Use backend value as final authority
        |--------------------------------------------------------------------------
        */

        const savedMode =
          normalizeMarketplaceMode(
            res.data.marketplace_mode
          );

        setMarketplaceModeState(
          savedMode
        );

        localStorage.setItem(
          'campusmart_marketplace_mode',
          savedMode
        );

        setUser((prev) => {

          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            marketplace_mode:
              savedMode,
          };
        });

      } catch (err) {

        console.error(
          'Failed to update marketplace mode:',
          err
        );

        /*
        |--------------------------------------------------------------------------
        | ROLLBACK
        |--------------------------------------------------------------------------
        |
        | If server update fails,
        | restore previous mode.
        */

        setMarketplaceModeState(
          previousMode
        );

        localStorage.setItem(
          'campusmart_marketplace_mode',
          previousMode
        );

        setUser((prev) => {

          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            marketplace_mode:
              previousMode,
          };
        });
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CHANGE BROWSING COLLEGE
  |--------------------------------------------------------------------------
  */

  const setSelectedCollegeId = (
    id: string | null
  ) => {

    if (user) {

      /*
      |--------------------------------------------------------------------------
      | Logged-in user
      |--------------------------------------------------------------------------
      */

      if (
        id &&
        id !== user.college.id
      ) {

        localStorage.setItem(
          'campusmart_browsing_college',
          id
        );

        setBrowsingCollegeId(
          id
        );

      } else {

        localStorage.removeItem(
          'campusmart_browsing_college'
        );

        setBrowsingCollegeId(
          null
        );
      }

    } else {

      /*
      |--------------------------------------------------------------------------
      | Guest user
      |--------------------------------------------------------------------------
      */

      if (id) {

        localStorage.setItem(
          'campusmart_guest_college',
          id
        );

      } else {

        localStorage.removeItem(
          'campusmart_guest_college'
        );
      }

      setGuestCollegeId(id);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESET TO USER HOME COLLEGE
  |--------------------------------------------------------------------------
  */

  const resetToHomeCollege =
    () => {

      localStorage.removeItem(
        'campusmart_browsing_college'
      );

      setBrowsingCollegeId(
        null
      );
    };

  /*
  |--------------------------------------------------------------------------
  | DETERMINE ACTIVE COLLEGE
  |--------------------------------------------------------------------------
  */

  const activeCollegeId =
    user
      ? browsingCollegeId ||
        user.college.id
      : guestCollegeId;

  /*
  |--------------------------------------------------------------------------
  | CHECK IF USER IS BROWSING ANOTHER COLLEGE
  |--------------------------------------------------------------------------
  */

  const isBrowsingOtherCollege =
    Boolean(
      user &&
        browsingCollegeId &&
        browsingCollegeId !==
          user.college.id
    );

  /*
  |--------------------------------------------------------------------------
  | PROVIDER
  |--------------------------------------------------------------------------
  */

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,

        login,
        register,
        logout,
        refreshUser,

        marketplaceMode,
        setMarketplaceMode,

        selectedCollegeId:
          activeCollegeId,

        setSelectedCollegeId,

        resetToHomeCollege,

        isBrowsingOtherCollege,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/*
|--------------------------------------------------------------------------
| USE AUTH HOOK
|--------------------------------------------------------------------------
*/

export const useAuth = () => {

  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};