// Fotos de usinas e instalações (Unsplash, licença Unsplash). Verificadas em 2026-11-19.
const u = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const PHOTOS = {
  /** Fileiras de painéis sob céu azul — hero */
  usinaCeu: (w = 2200) => u('photo-1508514177221-188b1cf16e9d', w),
  /** Usina em campo com nuvens — chamada de adesão */
  usinaCampo: (w = 2000) => u('photo-1509391366360-2e959784a276', w),
  /** Mãos de instalador fixando conectores — seção sobre a Frente */
  instalador: (w = 1400) => u('photo-1559302504-64aae6ca6b6d', w),
  /** Vista aérea de painéis sobre gramado — faixa da comissão */
  aerea: (w = 2000) => u('photo-1497440001374-f26997328c1b', w),
  /** Corredor entre fileiras de painéis */
  corredor: (w = 1400) => u('photo-1545208942-e1c9c916524b', w),
};
