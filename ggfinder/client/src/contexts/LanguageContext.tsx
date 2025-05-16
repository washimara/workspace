import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Language {
  name: string;
  code: string;
  translations: Record<string, string>;
}

// Define available languages with their translations
const availableLanguages: Language[] = [
  {
    name: "English",
    code: "en",
    translations: {
      home: "Home",
      signIn: "Sign In",
      logIn: "Log In",
      register: "Register",
      createPost: "Create Post",
      myPosts: "My Posts",
      search: "Search",
      searchPlaceholder: "Search for activities, events, or services...",
      findYourGoodStuff: "Find your good stuff",
      findNextActivity: "Find your next activity",
      createAccount: "Create an account",
      name: "Name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      pleaseWait: "Please wait",
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: "Already have an account?",
      logout: "Logout",
      profile: "Profile",
      errorTitle: "Error",
      successTitle: "Success",
      searchResults: "Search Results",
      noResults: "No results found",
      tryDifferentKeywords: "Try different keywords or filters",
      loadingResults: "Loading results...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit"
    }
  },
  {
    name: "Español",
    code: "es",
    translations: {
      home: "Inicio",
      signIn: "Iniciar Sesión",
      logIn: "Ingresar",
      register: "Registrarse",
      createPost: "Crear Publicación",
      myPosts: "Mis Publicaciones",
      search: "Buscar",
      searchPlaceholder: "Buscar actividades, eventos o servicios...",
      findYourGoodStuff: "Encuentra tus cosas buenas",
      findNextActivity: "Encuentra tu próxima actividad",
      createAccount: "Crear una cuenta",
      name: "Nombre",
      email: "Correo",
      password: "Contraseña",
      confirmPassword: "Confirmar Contraseña",
      pleaseWait: "Por favor espere",
      dontHaveAccount: "¿No tienes una cuenta?",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      logout: "Cerrar Sesión",
      profile: "Perfil",
      errorTitle: "Error",
      successTitle: "Éxito",
      searchResults: "Resultados de búsqueda",
      noResults: "No se encontraron resultados",
      tryDifferentKeywords: "Intente con diferentes palabras clave o filtros",
      loadingResults: "Cargando resultados...",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar"
    }
  },
  {
    name: "Français",
    code: "fr",
    translations: {
      home: "Accueil",
      signIn: "Se Connecter",
      logIn: "Connexion",
      register: "S'inscrire",
      createPost: "Créer une Publication",
      myPosts: "Mes Publications",
      search: "Rechercher",
      searchPlaceholder: "Rechercher des activités, événements ou services...",
      findYourGoodStuff: "Trouvez vos bonnes choses",
      findNextActivity: "Trouvez votre prochaine activité",
      createAccount: "Créer un compte",
      name: "Nom",
      email: "Email",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      pleaseWait: "Veuillez patienter",
      dontHaveAccount: "Vous n'avez pas de compte?",
      alreadyHaveAccount: "Vous avez déjà un compte?",
      logout: "Déconnexion",
      profile: "Profil",
      errorTitle: "Erreur",
      successTitle: "Succès",
      searchResults: "Résultats de recherche",
      noResults: "Aucun résultat trouvé",
      tryDifferentKeywords: "Essayez différents mots-clés ou filtres",
      loadingResults: "Chargement des résultats...",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier"
    }
  }
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(availableLanguages[0]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language');
    if (savedLanguage) {
      const language = availableLanguages.find(l => l.code === savedLanguage);
      if (language) {
        setCurrentLanguage(language);
      }
    }
  }, []);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('app-language', language.code);
  };

  // Translate function that returns the translated text for a given key
  const t = (key: string): string => {
    return currentLanguage.translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      setLanguage, 
      t,
      languages: availableLanguages 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};