import type Datastore from '@seald-io/nedb';

/**
 * Aplica `$set` no documento, devolve a versão gravada e compacta o arquivo
 * do NeDB. Erros do update sobem para o controller (que responde 500);
 * falha na compactação não bloqueia a resposta.
 */
export async function atualizarPorId<T>(banco: Datastore<T>, id: string, alteracoes: Partial<T>) {
  await banco.updateAsync({ _id: id }, { $set: alteracoes }, {});
  const atualizado = await banco.findOneAsync({ _id: id });
  await banco.compactDatafileAsync().catch(() => undefined);
  return atualizado;
}
