'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';

const DEFAULT_AVATAR = '/vercel.svg';

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  basePrompt: string;
  greetingText: string;
}

interface CharacterPickerProps {
  onCharacterSelect: (character: Character) => void;
  selectedCharacterId?: string;
}

export default function CharacterPicker({ onCharacterSelect, selectedCharacterId }: CharacterPickerProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/character');
        const data = await response.json();
        setCharacters(data);
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading characters...</div>;
  }

  return (
    <div className="w-full h-screen relative">
      <Swiper
        direction={isMobile ? 'vertical' : 'horizontal'}
        slidesPerView={isMobile ? 1 : 3}
        spaceBetween={30}
        centeredSlides={!isMobile}
        breakpoints={{
          640: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 3,
          },
        }}
        pagination={{ clickable: true }}
        modules={[Pagination]}
        className={`mySwiper h-screen ${isMobile ? 'overflow-auto' : ''}`}
      >
        {characters.map((character) => (
          <SwiperSlide key={character.id} className="h-full">
            <div
              className="cursor-pointer transition-all duration-300 hover:scale-105 h-full border border-e-red-100 relative"
              onClick={() => onCharacterSelect(character)}
            >
              <div className="text-center w-full h-full">
                <div className="w-full h-full overflow-hidden mx-auto mb-3 relative">
                  <Image
                    src={imageErrors.has(character.id) ? DEFAULT_AVATAR : character.image}
                    alt={character.name}
                    width={500}
                    height={500}
                    className="absolute left-0 top-0 w-full h-full object-cover"
                    onError={() => setImageErrors(prev => new Set(prev).add(character.id))}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <h3 className="font-bold text-lg text-white">{character.name}</h3>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
