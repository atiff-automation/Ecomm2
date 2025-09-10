'use client';

import React from 'react';
import { QuickReply } from './QuickReply';
import { chatUtils } from './utils/chat-utils';
import type { RichContent as RichContentType, RichContentCard, QuickReply as QuickReplyType } from './types';

interface RichContentProps {
  richContent: RichContentType;
  onQuickReply: (reply: string) => void;
  disabled?: boolean;
}

/**
 * Rich Content Component
 * Displays rich content including cards, carousels, and image galleries
 * Follows DRY principles with centralized styling and behavior
 */
export const RichContent: React.FC<RichContentProps> = ({
  richContent,
  onQuickReply,
  disabled = false
}) => {
  if (!richContent) return null;

  const renderCard = (card: RichContentCard, index: number) => (
    <div key={`card-${index}`} className="rich-content-card" role="article">
      {card.imageUrl && (
        <div className="rich-content-card__image">
          <img
            src={card.imageUrl}
            alt={card.title || 'Card image'}
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="rich-content-card__content">
        {card.title && (
          <h3 className="rich-content-card__title">{card.title}</h3>
        )}
        
        {card.subtitle && (
          <h4 className="rich-content-card__subtitle">{card.subtitle}</h4>
        )}
        
        {card.description && (
          <p className="rich-content-card__description">{card.description}</p>
        )}
        
        {card.buttons && card.buttons.length > 0 && (
          <div className="rich-content-card__actions">
            <QuickReply
              replies={card.buttons}
              onQuickReply={onQuickReply}
              disabled={disabled}
              config={{ layout: 'vertical', buttonStyle: 'rounded' }}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderCarousel = () => {
    if (!richContent.cards || richContent.cards.length === 0) return null;

    return (
      <div 
        className="rich-content-carousel" 
        role="region" 
        aria-label="Content carousel"
      >
        <div className="rich-content-carousel__track">
          {richContent.cards.map((card, index) => renderCard(card, index))}
        </div>
        
        {richContent.cards.length > 1 && (
          <div className="rich-content-carousel__indicators" role="tablist">
            {richContent.cards.map((_, index) => (
              <button
                key={`indicator-${index}`}
                className="rich-content-carousel__indicator"
                role="tab"
                aria-label={`View card ${index + 1}`}
                onClick={(e) => {
                  const track = e.currentTarget.closest('.rich-content-carousel')
                    ?.querySelector('.rich-content-carousel__track') as HTMLElement;
                  if (track) {
                    track.scrollTo({
                      left: index * 280, // Card width + gap
                      behavior: 'smooth'
                    });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderImageGallery = () => {
    if (!richContent.images || richContent.images.length === 0) return null;

    return (
      <div 
        className="rich-content-gallery" 
        role="img" 
        aria-label="Image gallery"
      >
        {richContent.images.map((imageUrl, index) => (
          <div key={`image-${index}`} className="rich-content-gallery__item">
            <img
              src={imageUrl}
              alt={`Gallery image ${index + 1}`}
              loading="lazy"
              onClick={() => {
                // Optional: Open image in modal/lightbox
                window.open(imageUrl, '_blank');
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderList = () => {
    if (!richContent.cards || richContent.cards.length === 0) return null;

    return (
      <div className="rich-content-list" role="list">
        {richContent.cards.map((card, index) => (
          <div key={`list-item-${index}`} className="rich-content-list__item" role="listitem">
            {card.imageUrl && (
              <div className="rich-content-list__image">
                <img
                  src={card.imageUrl}
                  alt={card.title || 'List item image'}
                  loading="lazy"
                />
              </div>
            )}
            
            <div className="rich-content-list__content">
              {card.title && (
                <h4 className="rich-content-list__title">{card.title}</h4>
              )}
              
              {card.description && (
                <p className="rich-content-list__description">{card.description}</p>
              )}
            </div>
            
            {card.buttons && card.buttons.length > 0 && (
              <div className="rich-content-list__actions">
                <QuickReply
                  replies={card.buttons.slice(0, 2)} // Limit buttons in list view
                  onQuickReply={onQuickReply}
                  disabled={disabled}
                  config={{ layout: 'horizontal', buttonStyle: 'square' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (richContent.type) {
      case 'card':
        return richContent.cards && richContent.cards.length > 0 ? 
          renderCard(richContent.cards[0], 0) : null;
      
      case 'carousel':
        return renderCarousel();
      
      case 'list':
        return renderList();
      
      case 'image_gallery':
        return renderImageGallery();
      
      default:
        return null;
    }
  };

  return (
    <div className={`rich-content rich-content--${richContent.type}`}>
      {renderContent()}

      <style jsx>{`
        .rich-content {
          margin: 12px 0;
          border-radius: 8px;
          overflow: hidden;
        }

        /* Card Styles */
        .rich-content-card {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          overflow: hidden;
          max-width: 280px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: box-shadow 200ms ease;
        }

        .rich-content-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .rich-content-card__image {
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: #f8f9fa;
        }

        .rich-content-card__image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 200ms ease;
        }

        .rich-content-card__image:hover img {
          transform: scale(1.02);
        }

        .rich-content-card__content {
          padding: 16px;
        }

        .rich-content-card__title {
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .rich-content-card__subtitle {
          font-size: 14px;
          font-weight: 500;
          color: #4a5568;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .rich-content-card__description {
          font-size: 13px;
          color: #718096;
          margin: 0 0 16px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rich-content-card__actions {
          margin-top: 12px;
        }

        /* Carousel Styles */
        .rich-content-carousel {
          position: relative;
          max-width: 100%;
        }

        .rich-content-carousel__track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .rich-content-carousel__track::-webkit-scrollbar {
          display: none;
        }

        .rich-content-carousel .rich-content-card {
          flex: 0 0 280px;
          scroll-snap-align: start;
        }

        .rich-content-carousel__indicators {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
          padding: 0 4px;
        }

        .rich-content-carousel__indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: #cbd5e0;
          cursor: pointer;
          transition: background-color 200ms ease;
        }

        .rich-content-carousel__indicator:hover {
          background: #a0aec0;
        }

        .rich-content-carousel__indicator.active {
          background: #007bff;
        }

        /* List Styles */
        .rich-content-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rich-content-list__item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          transition: background-color 200ms ease;
        }

        .rich-content-list__item:hover {
          background: #f8f9fa;
        }

        .rich-content-list__image {
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
          background: #f8f9fa;
        }

        .rich-content-list__image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rich-content-list__content {
          flex: 1;
          min-width: 0;
        }

        .rich-content-list__title {
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .rich-content-list__description {
          font-size: 13px;
          color: #718096;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rich-content-list__actions {
          flex: 0 0 auto;
          margin-left: 8px;
        }

        /* Image Gallery Styles */
        .rich-content-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
          padding: 4px;
        }

        .rich-content-gallery__item {
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          background: #f8f9fa;
          cursor: pointer;
          transition: transform 200ms ease;
        }

        .rich-content-gallery__item:hover {
          transform: scale(1.02);
        }

        .rich-content-gallery__item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Dark theme support */
        .chat-window--dark .rich-content-card,
        .chat-window--dark .rich-content-list__item {
          background: #2d3748;
          border-color: #4a5568;
        }

        .chat-window--dark .rich-content-card__title,
        .chat-window--dark .rich-content-list__title {
          color: #e2e8f0;
        }

        .chat-window--dark .rich-content-card__subtitle {
          color: #cbd5e0;
        }

        .chat-window--dark .rich-content-card__description,
        .chat-window--dark .rich-content-list__description {
          color: #a0aec0;
        }

        .chat-window--dark .rich-content-list__item:hover {
          background: #374151;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .rich-content-card {
            max-width: none;
            width: 100%;
          }

          .rich-content-carousel .rich-content-card {
            flex: 0 0 260px;
          }

          .rich-content-gallery {
            grid-template-columns: repeat(3, 1fr);
          }

          .rich-content-list__item {
            padding: 10px;
          }

          .rich-content-list__image {
            flex: 0 0 40px;
            width: 40px;
            height: 40px;
          }
        }

        /* Accessibility improvements */
        .rich-content-gallery__item:focus,
        .rich-content-card:focus-within {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .rich-content-card,
          .rich-content-gallery__item,
          .rich-content-carousel__indicator {
            transition: none;
          }
          
          .rich-content-card__image:hover img {
            transform: none;
          }
          
          .rich-content-gallery__item:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};