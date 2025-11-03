import { useState, useEffect } from 'react';
import { User, Heart, Star, Edit2, Save, X, Camera, ChefHat, Coffee } from 'lucide-react';
import userService from '../services/userService';
import reviewService from '../services/reviewService';
import { getFavoriteRecipes } from '../utils/favoriteUtils';

export default function ProfilePage({ onRecipeClick }) {
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'reviews'
  const [isEditing, setIsEditing] = useState(false);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState({
    username: 'Pengguna',
    avatar: null,
    bio: ''
  });
  
  const [editProfile, setEditProfile] = useState({
    username: '',
    bio: ''
  });

  // Favorites - menggunakan localStorage
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const [favError, setFavError] = useState(null);
  
  // Reviews
  const [userReviews, setUserReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    const profile = userService.getUserProfile();
    setUserProfile(profile);
    setEditProfile({
      username: profile.username,
      bio: profile.bio || ''
    });
    
    // Load favorites from localStorage
    loadFavoritesFromLocalStorage();
  }, []);

  // Load favorites from localStorage
  const loadFavoritesFromLocalStorage = async () => {
    try {
      setFavLoading(true);
      setFavError(null);
      
      // Use utility function to get favorites
      const recipes = await getFavoriteRecipes();
      setFavorites(recipes);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setFavError('Gagal memuat favorit');
    } finally {
      setFavLoading(false);
    }
  };

  // Listen to localStorage changes (when favorite is toggled)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'favorites') {
        loadFavoritesFromLocalStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen to custom event for same-window updates
    const handleFavoriteUpdate = () => {
      loadFavoritesFromLocalStorage();
    };
    window.addEventListener('favoriteUpdated', handleFavoriteUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
    };
  }, []);

  // Load user reviews
  useEffect(() => {
    loadUserReviews();
  }, []);

  const loadUserReviews = async () => {
    try {
      setReviewsLoading(true);
      const userIdentifier = userService.getUserIdentifier();
      
      // Get all reviews from favorites
      const reviewsPromises = favorites.map(async (recipe) => {
        try {
          const response = await reviewService.getReviews(recipe.id);
          if (response.success && response.data) {
            // Filter reviews by current user
            const userReview = response.data.find(
              review => review.user_identifier === userIdentifier
            );
            if (userReview) {
              return {
                ...userReview,
                recipe_name: recipe.name,
                recipe_id: recipe.id,
                recipe_image: recipe.image_url,
                recipe_category: recipe.category
              };
            }
          }
          return null;
        } catch (err) {
          return null;
        }
      });

      const reviews = await Promise.all(reviewsPromises);
      setUserReviews(reviews.filter(r => r !== null));
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = userService.updateAvatar(reader.result);
      if (result.success) {
        setUserProfile(result.data);
        alert('Avatar berhasil diperbarui!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle save profile
  const handleSaveProfile = () => {
    const result = userService.saveUserProfile({
      username: editProfile.username.trim() || 'Pengguna',
      bio: editProfile.bio.trim(),
      avatar: userProfile.avatar
    });

    if (result.success) {
      setUserProfile(result.data);
      setIsEditing(false);
      alert('Profil berhasil diperbarui!');
    } else {
      alert('Gagal memperbarui profil: ' + result.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Profile Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                )}
              </div>
              
              {/* Change Avatar Button */}
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editProfile.username}
                      onChange={(e) => setEditProfile({ ...editProfile, username: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nama pengguna"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={editProfile.bio}
                      onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Ceritakan tentang dirimu..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Simpan
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditProfile({
                          username: userProfile.username,
                          bio: userProfile.bio || ''
                        });
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                      {userProfile.username}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit profil"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {userProfile.bio && (
                    <p className="text-slate-600 mb-4">{userProfile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{favorites.length} Favorit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{userReviews.length} Ulasan</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-white/40">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'favorites'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                <span>Favorit ({favorites.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'reviews'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5" />
                <span>Ulasan ({userReviews.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'favorites' ? (
          /* Favorites Tab */
          <div>
            {favLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Memuat favorit...</p>
              </div>
            ) : favError ? (
              <div className="text-center py-12">
                <p className="text-red-600">Error: {favError}</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">Belum ada resep favorit</p>
                <p className="text-slate-500">Tambahkan resep ke favorit untuk melihatnya di sini</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => onRecipeClick && onRecipeClick(recipe.id, recipe.category)}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group border border-white/40"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={recipe.image_url}
                        alt={recipe.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          recipe.category === 'makanan'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {recipe.category === 'makanan' ? (
                            <span className="flex items-center gap-1">
                              <ChefHat className="w-3 h-3" />
                              Makanan
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Coffee className="w-3 h-3" />
                              Minuman
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {recipe.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{recipe.average_rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <span className="text-xs text-slate-500">{recipe.difficulty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Reviews Tab */
          <div>
            {reviewsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Memuat ulasan...</p>
              </div>
            ) : userReviews.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">Belum ada ulasan</p>
                <p className="text-slate-500">Berikan ulasan pada resep favorit Anda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Recipe Image */}
                      <div
                        onClick={() => onRecipeClick && onRecipeClick(review.recipe_id, review.recipe_category)}
                        className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={review.recipe_image}
                          alt={review.recipe_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3
                              onClick={() => onRecipeClick && onRecipeClick(review.recipe_id, review.recipe_category)}
                              className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              {review.recipe_name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-slate-700 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}