export interface Time {
  id?: string;
  _id?: string;
  nome: string;
  estadio: string;
  anoFundacao: string | number;
  imagem?: string | null;
  imagemEstadio?: string | null;
}

export interface Jogador {
  id?: string;
  _id?: string;
  nome: string;
  idade: string | number;
  posicao: string;
  numeroCamisa: string | number;
  timeId: string;
  imagem?: string | null;
}

export interface Tecnico {
  id?: string;
  _id?: string;
  nome: string;
  idade: string | number;
  timeId: string;
  imagem?: string | null;
}

export interface ApiResponse<T> {
  sucesso: boolean;
  dados: T;
  total?: number;
}
