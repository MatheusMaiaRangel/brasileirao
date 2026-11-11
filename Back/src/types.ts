export interface TimeRecord {
  nome: string;
  estadio: string;
  anoFundacao: string | number;
  imagem: string | null;
  imagemEstadio: string | null;
}

export interface JogadorRecord {
  nome: string;
  idade: string | number;
  posicao: string | null;
  numeroCamisa: string | number;
  imagem: string | null;
  timeId: string;
}

export interface IdParams {
  id: string;
}

export interface TimeIdParams {
  timeId: string;
}
