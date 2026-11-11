import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { FiPlus, FiTrash2, FiEdit2, FiX, FiImage } from "react-icons/fi";
import Swal from "sweetalert2";
import api, { comImagem } from "../services/api";
import { getTimeImageUrl } from "../utils/timeHelpers";
import TecnicoSecao from "./TecnicoSecao";
import "./Times.css";
import "./responsive.css";
import type { ApiResponse, Jogador, Time } from "../types";

type Feedback = { text: string; type: "success" | "error" };
type JogadorEdicao = Jogador & { originalTimeId: string };

export default function TimeDetalhes({ time, onVoltar }: { time: Time; onVoltar: () => void }) {
    const timeId = time.id || time._id;
    const imageUrl = getTimeImageUrl(time, api.defaults.baseURL);
    const estadioUrl = getTimeImageUrl({ imagem: time.imagemEstadio }, api.defaults.baseURL);

    const [jogadores, setJogadores] = useState<Jogador[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [form, setForm] = useState({ nome: "", idade: "", posicao: "", numeroCamisa: "" });
    const [arquivoJogador, setArquivoJogador] = useState<File | null>(null);
    const [editando, setEditando] = useState<JogadorEdicao | null>(null);
    const [arquivoEdicao, setArquivoEdicao] = useState<File | null>(null);
    const [times, setTimes] = useState<Time[]>([]);
    const [message, setMessage] = useState<Feedback | null>(null);
    const messageTimeoutRef = useRef<number | null>(null);

    const showMessage = useCallback((text: string, type: Feedback["type"] = "success") => {
        if (messageTimeoutRef.current) window.clearTimeout(messageTimeoutRef.current);
        setMessage({ text, type });
        messageTimeoutRef.current = window.setTimeout(() => setMessage(null), 3000);
    }, []);

    const carregarJogadores = useCallback(async () => {
        setCarregando(true);
        try {
            const response = await api.get<ApiResponse<Jogador[]>>(`/times/${timeId}/jogadores`);
            setJogadores(response.data.dados || []);
        } catch (error) {
            console.error(error);
            showMessage("Erro ao carregar jogadores", "error");
        } finally {
            setCarregando(false);
        }
    }, [timeId, showMessage]);

    const carregarTimes = useCallback(async () => {
        try {
            const response = await api.get<ApiResponse<Time[]>>('/times');
            setTimes(response.data.dados || []);
        } catch (error) {
            console.error('Erro ao carregar times', error);
        }
    }, []);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            void carregarJogadores();
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [carregarJogadores]);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            void carregarTimes();
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [carregarTimes]);

    async function cadastrarJogador(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formElement = e.currentTarget;
        try {
            const dados = {
                nome: form.nome,
                idade: String(form.idade),
                posicao: form.posicao,
                numeroCamisa: String(form.numeroCamisa),
                timeId,
            };
            await api.post("/jogadores", comImagem(dados, arquivoJogador));
            setForm({ nome: "", idade: "", posicao: "", numeroCamisa: "" });
            setArquivoJogador(null);
            formElement.reset();
            await carregarJogadores();
            showMessage("Jogador adicionado com sucesso.");
        } catch (error) {
            console.error(error);
            const msg = axios.isAxiosError<{ erro?: string }>(error) ? error.response?.data?.erro || "Erro ao cadastrar jogador" : "Erro ao cadastrar jogador";
            showMessage(msg, "error");
        }
    }

    async function deletarJogador(id: string | undefined) {
        if (!id) return;

        const result = await Swal.fire({
            title: "Excluir jogador?",
            text: "Essa ação não pode ser desfeita.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, excluir",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#3fb950",
            cancelButtonColor: "#6b7a70",
            background: "#0e1410",
            color: "#eef1ee",
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/jogadores/${id}`);
            await carregarJogadores();
            showMessage("Jogador removido com sucesso.");
        } catch (error) {
            console.error(error);
            const msg = axios.isAxiosError<{ erro?: string }>(error) ? error.response?.data?.erro || "Erro ao remover jogador" : "Erro ao remover jogador";
            showMessage(msg, "error");
        }
    }

    function abrirEditar(jogador: Jogador) {
        setEditando({ ...jogador, originalTimeId: jogador.timeId });
        setArquivoEdicao(null);
    }

    function fecharEditar() {
        setEditando(null);
        setArquivoEdicao(null);
    }

    async function atualizarJogador(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editando) return;
        const id = editando.id || editando._id;
        try {
            const dados = {
                nome: editando.nome,
                idade: String(editando.idade),
                posicao: editando.posicao,
                numeroCamisa: String(editando.numeroCamisa),
            };
            await api.put(`/jogadores/${id}`, comImagem(dados, arquivoEdicao));
            // se houve mudança de time, chamar endpoint de transferência
            if (editando.timeId && editando.timeId !== editando.originalTimeId) {
                try {
                    await api.patch(`/jogadores/${id}`, { timeId: editando.timeId });
                } catch (err) {
                    console.error('Erro ao transferir jogador', err);
                    setEditando(null);
                    await carregarJogadores();
                    const msg = axios.isAxiosError<{ erro?: string }>(err) ? err.response?.data?.erro || "Erro ao transferir jogador" : "Erro ao transferir jogador";
                    showMessage(`Dados atualizados, mas a transferência falhou: ${msg}`, "error");
                    return;
                }
            }
            setEditando(null);
            await carregarJogadores();
            showMessage("Jogador atualizado com sucesso.");
        } catch (error) {
            console.error(error);
            const msg = axios.isAxiosError<{ erro?: string }>(error) ? error.response?.data?.erro || "Erro ao atualizar jogador" : "Erro ao atualizar jogador";
            showMessage(msg, "error");
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#0e1410", color: "#eef1ee", fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Header */}
            <header style={{
                borderBottom: "1px solid #1f2a23", padding: "28px 32px",
                display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12
            }}>
                <div>
                    <button className="back-btn" onClick={onVoltar} style={{
                        background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer",
                        fontFamily: "Oswald, sans-serif", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase",
                        padding: 0, marginBottom: 8, transition: "color .15s"
                    }}>
                        ← Voltar aos clubes
                    </button>
                    <h1 style={{ fontFamily: "Oswald, sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                        {time.nome}
                    </h1>
                </div>
                <div style={{ fontFamily: "Oswald, sans-serif", textAlign: "right" }}>
                    <div style={{ fontSize: 40, fontWeight: 700, color: "#3fb950", lineHeight: 1 }}>
                        {String(jogadores.length).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#6b7a70", textTransform: "uppercase" }}>
                        {jogadores.length === 1 ? "jogador" : "jogadores"}
                    </div>
                </div>
            </header>

            <div className="details-container" style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 32px 64px" }}>

                {message && <div className={`feedback ${message.type}`}>{message.text}</div>}

                {/* Info do clube */}
                <section style={{ marginBottom: 48 }}>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 12 }}>
                        Informações do Clube
                    </div>
                    <div className="team-overview">
                        <div className="team-hero">
                            {imageUrl ? (
                                <img src={imageUrl} alt={`Escudo do ${time.nome}`} className="team-hero-image" />
                            ) : (
                                <div className="team-hero-fallback" aria-label="Sem imagem do clube">
                                    <span>{String(time.nome || "TC").trim().slice(0, 2).toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                        <div className={`team-info${estadioUrl ? " with-stadium" : ""}`}>
                            <div className="team-info-fields">
                            <div>
                                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 4 }}>Nome</div>
                                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, fontWeight: 600 }}>{time.nome}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 4 }}>Estádio</div>
                                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, fontWeight: 600 }}>{time.estadio}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 4 }}>Fundação</div>
                                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, fontWeight: 600, color: "#3fb950" }}>{time.anoFundacao}</div>
                            </div>
                            </div>
                            {estadioUrl && (
                                <div className="team-stadium">
                                    <img src={estadioUrl} alt={`Estádio ${time.estadio}`} className="team-stadium-image" />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Técnico */}
                <TecnicoSecao timeId={timeId as string} onMensagem={showMessage} />

                {/* Novo jogador */}
                <section style={{ marginBottom: 48 }}>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 12 }}>
                        Novo Jogador
                    </div>
                    <form className="player-form" onSubmit={cadastrarJogador} style={{
                        display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1.4fr auto", gap: 12, alignItems: "center",
                        background: "#131b16", border: "1px solid #1f2a23", borderRadius: 8, padding: 18
                    }}>
                        <input className="field" type="text" placeholder="Nome" value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                        <input className="field" type="number" placeholder="Idade" value={form.idade}
                            onChange={(e) => setForm({ ...form, idade: e.target.value })} required />
                        <input className="field" type="text" placeholder="Posição" value={form.posicao}
                            onChange={(e) => setForm({ ...form, posicao: e.target.value })} required />
                        <input className="field" type="number" placeholder="Nº" value={form.numeroCamisa}
                            onChange={(e) => setForm({ ...form, numeroCamisa: e.target.value })} required />
                        <label className={`file-label${arquivoJogador ? " has-file" : ""}`} title="Foto do jogador (opcional)">
                            <FiImage size={15} />
                            {arquivoJogador ? arquivoJogador.name : "Foto (opcional)"}
                            <input type="file" accept="image/*" hidden
                                onChange={(e) => setArquivoJogador(e.target.files?.[0] || null)} />
                        </label>
                        <button type="submit" className="btn btn-primary btn-add">
                            <FiPlus size={16} /> Adicionar
                        </button>
                    </form>
                </section>

                {/* Lista de jogadores */}
                <section>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 12 }}>
                        Elenco
                    </div>

                    {carregando ? (
                        <div style={{ color: "#6b7a70", fontSize: 14, padding: "24px 0" }}>Carregando jogadores...</div>
                    ) : jogadores.length === 0 ? (
                        <div style={{
                            border: "1px dashed #2a352e", borderRadius: 8, padding: "48px 24px",
                            textAlign: "center", color: "#6b7a70", fontSize: 14
                        }}>
                            Nenhum jogador cadastrado neste clube. Use o formulário acima para adicionar o primeiro.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {jogadores.map((jogador, index) => (
                                <div key={jogador.id || jogador._id || index} className="row-player" style={{
                                    background: "#131b16", border: "1px solid #1f2a23", borderRadius: 8,
                                    padding: "14px 18px", display: "flex", alignItems: "center", gap: 16
                                }}>
                                    {getTimeImageUrl(jogador, api.defaults.baseURL) && (
                                        <img className="player-avatar"
                                            src={getTimeImageUrl(jogador, api.defaults.baseURL)}
                                            alt={jogador.nome} />
                                    )}
                                    <div style={{
                                        fontFamily: "Oswald, sans-serif", fontSize: 22, fontWeight: 700, color: "#3fb950",
                                        minWidth: 40, textAlign: "center"
                                    }}>
                                        {String(jogador.numeroCamisa).padStart(2, "0")}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 17, fontWeight: 600 }}>{jogador.nome}</div>
                                        <div style={{ fontSize: 13, color: "#a8b5ad" }}>
                                            {jogador.posicao} · {jogador.idade} anos
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button className="edit-btn" onClick={() => abrirEditar(jogador)} title="Editar jogador" style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer", fontSize: 13, fontFamily: "inherit", letterSpacing: "0.05em"
                                        }}>
                                            <FiEdit2 size={18} />
                                            
                                        </button>
                                        <button className="del-btn" onClick={() => deletarJogador(jogador.id || jogador._id)} title="Remover jogador" style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer", fontSize: 13, fontFamily: "inherit", letterSpacing: "0.05em"
                                        }}>
                                            <FiTrash2 size={18} />
                                           
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Modal editar jogador */}
                {editando && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
                        <div className="player-edit-modal" style={{ width: 520, background: "#0e1410", border: "1px solid #1f2a23", borderRadius: 8, padding: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, color: "#3fb950", fontWeight: 600 }}>Editar Jogador</div>
                                <button onClick={fecharEditar} aria-label="Fechar" style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer" }}>
                                    <FiX size={18} />
                                </button>
                            </div>
                            <form className="player-edit-form" onSubmit={atualizarJogador} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <input className="field" type="text" placeholder="Nome" value={editando.nome || ""}
                                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })} required />
                                <input className="field" type="number" placeholder="Idade" value={editando.idade || ""}
                                    onChange={(e) => setEditando({ ...editando, idade: e.target.value })} required />
                                <input className="field" type="text" placeholder="Posição" value={editando.posicao || ""}
                                    onChange={(e) => setEditando({ ...editando, posicao: e.target.value })} required />
                                <input className="field" type="number" placeholder="Nº da camisa" value={editando.numeroCamisa || ""}
                                    onChange={(e) => setEditando({ ...editando, numeroCamisa: e.target.value })} required />

                                <div className="upload-row">
                                    {(arquivoEdicao || getTimeImageUrl(editando, api.defaults.baseURL)) && (
                                        <img className="img-preview" style={{ borderRadius: "50%" }}
                                            src={arquivoEdicao ? URL.createObjectURL(arquivoEdicao) : getTimeImageUrl(editando, api.defaults.baseURL)}
                                            alt="Foto do jogador" />
                                    )}
                                    <label className={`file-label${arquivoEdicao ? " has-file" : ""}`} title="Trocar foto">
                                        <FiImage size={15} />
                                        {arquivoEdicao ? arquivoEdicao.name : "Trocar foto (opcional)"}
                                        <input type="file" accept="image/*" hidden
                                            onChange={(e) => setArquivoEdicao(e.target.files?.[0] || null)} />
                                    </label>
                                </div>

                                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, color: "#3fb950", fontWeight: 600 }}>Transferir jogador</div>
                                <select className="field" value={editando.timeId || ""} onChange={(e) => setEditando({ ...editando, timeId: e.target.value })} style={{ gridColumn: "1 / -1" }}>
                                    <option disabled value="">Selecione um time para transferir</option>
                                    {times.map((t) => (
                                        <option key={t.id || t._id} value={t.id || t._id}>{t.nome}</option>
                                    ))}
                                </select>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "1 / -1" }}>
                                    <button type="submit" style={{ background: "#3fb950", color: "#0e1410", border: "none", borderRadius: 6, padding: "8px 14px", fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                                    <button type="button" onClick={fecharEditar} style={{ background: "transparent", color: "#6b7a70", border: "1px solid #2a352e", borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
