export interface Artwork {
  id: number;
  title: string;
  artist: string;
  meta: string;   // "year · medium"
  src: string;
  blurb: string;  // curatorial, present-tense, restrained
}

export const artworks: Artwork[] = [
  { id: 1, title: 'Wheat Field with Cypresses', artist: 'Vincent van Gogh', meta: '1889 · Oil on canvas',
    src: '/art/01-wheat-field-with-cypresses.jpg',
    blurb: 'The wind is visible. Van Gogh paints the field as one continuous current, the cypress a dark flame holding it still.' },
  { id: 2, title: 'The Great Wave off Kanagawa', artist: 'Katsushika Hokusai', meta: 'c.1831 · Woodblock',
    src: '/art/02-great-wave-off-kanagawa.jpg',
    blurb: 'A wave curls into claws above three slender boats. Beyond it, Fuji sits small and unmoved.' },
  { id: 3, title: 'Still Life with Apples', artist: 'Paul Cézanne', meta: 'c.1890 · Oil on canvas',
    src: '/art/03-still-life-with-apples.jpg',
    blurb: 'Cézanne tips the table toward us so the fruit cannot settle. Weight and color do the work perspective will not.' },
  { id: 4, title: 'The Monet Family in Their Garden', artist: 'Édouard Manet', meta: '1874 · Oil on canvas',
    src: '/art/04-monet-family-in-garden.jpg',
    blurb: "A summer afternoon caught loosely: Manet paints his friend's family in the grass with the speed of being there." },
  { id: 5, title: "L'Arlésienne: Madame Ginoux", artist: 'Vincent van Gogh', meta: '1888 · Oil on canvas',
    src: '/art/05-larlesienne-madame-ginoux.jpg',
    blurb: 'A woman rests her chin on her hand among yellow. The books beside her insist she is a person who thinks.' },
  { id: 6, title: 'The Card Players', artist: 'Paul Cézanne', meta: '1890 · Oil on canvas',
    src: '/art/06-card-players.jpg',
    blurb: 'Two men lean into a quiet game. Cézanne builds the scene like architecture — patient, deliberate, unhurried.' },
  { id: 7, title: 'Portrait of a Man', artist: 'Rembrandt van Rijn', meta: 'c.1660 · Oil on canvas',
    src: '/art/07-portrait-of-a-man.jpg',
    blurb: 'Light finds the face and lets the rest fall into shadow. Rembrandt asks you to meet a single steady gaze.' },
  { id: 8, title: 'Six Jewel Rivers', artist: 'Utagawa Hiroshige', meta: '1857 · Woodblock',
    src: '/art/08-six-jewel-rivers.jpg',
    blurb: 'Hiroshige gathers six famous rivers into one elegant conceit, water carrying name and place across the print.' },
  { id: 9, title: 'Madame X', artist: 'John Singer Sargent', meta: '1883–84 · Oil on canvas',
    src: '/art/09-madame-x.jpg',
    blurb: 'The gallery turns on her: a profile of cold marble against black, one strap once fallen. Scandal made her famous; the poise is what stays.' },
];
