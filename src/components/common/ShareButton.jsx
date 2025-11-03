// src/components/common/ShareButton.jsx
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

/**
 * ShareButton Component
 * Share recipe with native share API or copy to clipboard
 */
export default function ShareButton({ 
  recipeId, 
  recipeName, 
  category = 'makanan',
  size = 'md',
  variant = 'default' // 'default' | 'icon-only'
}) {
  const [copied, setCopied] = useState(false);

  const sizes = {
    sm: {
      button: 'w-8 h-8 text-xs',
      icon: 'w-3 h-3',
    },
    md: {
      button: 'w-10 h-10 text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      button: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    const shareUrl = `${window.location.origin}${window.location.pathname}#/recipe/${recipeId}/${category}`;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipeName || 'Resep Nusantara',
          text: `Lihat resep ${recipeName || 'ini'} di Resep Nusantara`,
          url: shareUrl,
        });
        console.log('✅ Recipe shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy error:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleShare}
        className={`
          ${sizes[size].button} rounded-full flex items-center justify-center
          transition-all duration-200
          ${copied 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600'
          }
          backdrop-blur-sm shadow-md hover:shadow-lg
          ${copied ? '' : 'hover:scale-110'}
        `}
        title={copied ? 'Link tersalin!' : 'Bagikan resep'}
      >
        {copied ? (
          <Check className={sizes[size].icon} />
        ) : (
          <Share2 className={sizes[size].icon} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`
        ${sizes[size].button}
        flex items-center gap-2 rounded-lg
        transition-all duration-200
        ${copied 
          ? 'bg-green-500 hover:bg-green-600 text-white' 
          : 'bg-white/90 hover:bg-white border border-slate-300 text-slate-700 hover:text-blue-600'
        }
        shadow-md hover:shadow-lg
      `}
      title={copied ? 'Link tersalin!' : 'Bagikan resep'}
    >
      {copied ? (
        <>
          <Check className={sizes[size].icon} />
          <span className="font-medium">Tersalin!</span>
        </>
      ) : (
        <>
          <Share2 className={sizes[size].icon} />
          <span className="font-medium">Bagikan</span>
        </>
      )}
    </button>
  );
}