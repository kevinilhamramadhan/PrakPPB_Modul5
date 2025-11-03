// src/pages/EditRecipePage.jsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Plus, Image as ImageIcon, Loader, AlertCircle } from 'lucide-react';
import recipeService from '../services/recipeService';
import uploadService from '../services/uploadService';

export default function EditRecipePage({ recipeId, onBack, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: 'makanan',
    description: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    difficulty: 'mudah',
    is_featured: false,
  });

  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [steps, setSteps] = useState(['']);
  
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Load recipe data
  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await recipeService.getRecipeById(recipeId);
        
        if (result.success) {
          const recipe = result.data;
          
          // Set form data
          setFormData({
            name: recipe.name || '',
            category: recipe.category || 'makanan',
            description: recipe.description || '',
            prep_time: recipe.prep_time || '',
            cook_time: recipe.cook_time || '',
            servings: recipe.servings || '',
            difficulty: recipe.difficulty || 'mudah',
            is_featured: recipe.is_featured || false,
          });
          
          // Set current image - IMPORTANT: Keep the original image URL
          setCurrentImageUrl(recipe.image_url || '');
          
          // Set ingredients
          if (recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
            setIngredients(recipe.ingredients.map(ing => ({
              name: ing.name || '',
              quantity: ing.quantity || ''
            })));
          } else {
            setIngredients([{ name: '', quantity: '' }]);
          }
          
          // Set steps - Handle both object and string formats
          if (recipe.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0) {
            const stepsArray = recipe.steps.map(step => {
              // If step is an object with instruction property
              if (typeof step === 'object' && step !== null) {
                return step.instruction || step.step || '';
              }
              // If step is already a string
              if (typeof step === 'string') {
                return step;
              }
              return '';
            }).filter(step => step.trim() !== '');
            
            setSteps(stepsArray.length > 0 ? stepsArray : ['']);
          } else {
            setSteps(['']);
          }
          
          console.log('✅ Recipe loaded successfully');
        } else {
          throw new Error(result.message || 'Gagal memuat data resep');
        }
      } catch (err) {
        console.error('Error loading recipe:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat resep');
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      loadRecipe();
    }
  }, [recipeId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file harus .jpg, .jpeg, .png, atau .webp');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleRemoveNewImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nama resep wajib diisi');
      return false;
    }

    if (formData.name.trim().length < 3) {
      setError('Nama resep minimal 3 karakter');
      return false;
    }

    if (!formData.prep_time || formData.prep_time <= 0) {
      setError('Waktu persiapan harus lebih dari 0');
      return false;
    }

    if (!formData.cook_time || formData.cook_time <= 0) {
      setError('Waktu memasak harus lebih dari 0');
      return false;
    }

    if (!formData.servings || formData.servings <= 0) {
      setError('Jumlah porsi harus lebih dari 0');
      return false;
    }

    const validIngredients = ingredients.filter(ing => 
      ing.name && ing.name.trim() && ing.quantity && ing.quantity.trim()
    );
    if (validIngredients.length === 0) {
      setError('Minimal harus ada 1 bahan dengan nama dan jumlah yang valid');
      return false;
    }

    const validSteps = steps.filter(step => {
      if (typeof step === 'string') {
        return step.trim() !== '';
      }
      return false;
    });
    if (validSteps.length === 0) {
      setError('Minimal harus ada 1 langkah yang valid');
      return false;
    }

    if (!currentImageUrl && !imageFile) {
      setError('Resep harus memiliki gambar');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);
      // PENTING: Gunakan gambar yang sudah ada sebagai default
      let finalImageUrl = currentImageUrl;

      // Hanya upload gambar baru jika user memilih file baru
      if (imageFile) {
        console.log('📤 Uploading new image...');
        setUploading(true);
        const uploadResult = await uploadService.uploadImage(imageFile);
        
        if (uploadResult.success) {
          finalImageUrl = uploadResult.data.url;
          console.log('✅ New image uploaded');
        } else {
          throw new Error('Gagal upload gambar: ' + (uploadResult.error || 'Unknown error'));
        }
        setUploading(false);
      } else {
        console.log('ℹ️ Using existing image:', finalImageUrl);
      }

      // Validasi final: pastikan ada image URL
      if (!finalImageUrl) {
        throw new Error('Image URL is required');
      }

      // Prepare data
      const validIngredients = ingredients
        .filter(ing => ing.name && ing.name.trim() && ing.quantity && ing.quantity.trim())
        .map(ing => ({
          name: ing.name.trim(),
          quantity: ing.quantity.trim()
        }));

      const validSteps = steps
        .filter(step => typeof step === 'string' && step.trim() !== '')
        .map(step => step.trim());

      const updateData = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        image_url: finalImageUrl, // SELALU include image_url (baru atau lama)
        prep_time: parseInt(formData.prep_time),
        cook_time: parseInt(formData.cook_time),
        servings: parseInt(formData.servings),
        difficulty: formData.difficulty,
        is_featured: formData.is_featured,
        ingredients: validIngredients,
        steps: validSteps
      };

      console.log('📝 Updating recipe...');

      const result = await recipeService.updateRecipe(recipeId, updateData);

      if (result.success) {
        console.log('✅ Recipe updated successfully');
        alert('Resep berhasil diperbarui!');
        if (onSuccess) {
          onSuccess(result.data);
        } else if (onBack) {
          onBack();
        }
      } else {
        throw new Error(result.message || 'Gagal memperbarui resep');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Terjadi kesalahan saat memperbarui resep');
    } finally {
      setUpdating(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Memuat data resep...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20 md:pb-8">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/40">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Edit Resep</h1>
          <p className="text-slate-600 mb-8">Perbarui informasi resepmu</p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 font-medium">Error</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* FORM CONTINUES - Copy rest of the form from the previous artifact at document index 33 */}
          {/* Due to length, I'm showing the key fixes. The full form structure remains the same */}
          
        </div>
      </main>
    </div>
  );
}