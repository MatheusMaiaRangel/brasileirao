import { useCallback, useEffect, useRef, useState } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import api from "../services/api";
import { getTimeImageUrl } from "../utils/timeHelpers";
import "./Times.css";

export default function TimeDetalhes({ time, onVoltar }) {
    const timeId = time.id || time._id;
    const imageUrl = getTimeImageUrl(time, api.defaults.baseURL);

    const [jogadores, setJogadores] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [form, setForm] = useState({ nome: "", idade: "", posicao: "", numeroCamisa: "" });
    const [editando, setEditando] = useState(null);
    const [times, setTimes] = useState([]);
    const [message, setMessage] = useState(null);
    const messageTimeoutRef = useRef(null);

    function showMessage(text, type = "success") {
        if (messageTimeoutRef.current) window.clearTimeout(messageTimeoutRef.current);
        setMessage({ text, type });
        messageTimeoutRef.current = window.setTimeout(() => setMessage(null), 3000);
    }

    const carregarJogadores = useCallback(async () => {
        setCarregando(true);
        try {
            const response = await api.get(`/times/${timeId}/jogadores`);
            setJogadores(response.data.dados || []);
        } catch (error) {
            console.error(error);
            showMessage("Erro ao carregar jogadores", "error");
        } finally {
            setCarregando(false);
        }
    }, [timeId]);

    const carregarTimes = useCallback(async () => {
        try {
            const response = await api.get('/times');
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
        void carregarTimes();
    }, [carregarTimes]);

    async function cadastrarJogador(e) {
        e.preventDefault();
        try {
            await api.post("/jogadores", {
                nome: form.nome,
                idade: String(form.idade),
                posicao: form.posicao,
                numeroCamisa: String(form.numeroCamisa),
                timeId,
            });
            setForm({ nome: "", idade: "", posicao: "", numeroCamisa: "" });
            await carregarJogadores();
            showMessage("Jogador adicionado com sucesso.");
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.erro || "Erro ao cadastrar jogador";
            showMessage(msg, "error");
        }
    }

    async function deletarJogador(id) {
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
            const msg = error?.response?.data?.erro || "Erro ao remover jogador";
            showMessage(msg, "error");
        }
    }

    function abrirEditar(jogador) {
        setEditando({ ...jogador, originalTimeId: jogador.timeId });
    }

    function fecharEditar() {
        setEditando(null);
    }

    async function atualizarJogador(e) {
        e.preventDefault();
        if (!editando) return;
        const id = editando.id || editando._id;
        try {
            await api.put(`/jogadores/${id}`, {
                nome: editando.nome,
                idade: String(editando.idade),
                posicao: editando.posicao,
                numeroCamisa: String(editando.numeroCamisa),
            });
            // se houve mudança de time, chamar endpoint de transferência
            if (editando.timeId && editando.timeId !== editando.originalTimeId) {
                try {
                    await api.patch(`/jogadores/${id}`, { timeId: editando.timeId });
                } catch (err) {
                    console.error('Erro ao transferir jogador', err);
                    // não abortar todo o fluxo — exibiremos mensagem após recarregar
                }
            }
            setEditando(null);
            await carregarJogadores();
            showMessage("Jogador atualizado com sucesso.");
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.erro || "Erro ao atualizar jogador";
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

            <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 32px 64px" }}>

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
                        <div style={{
                            display: "grid", gridTemplateColumns: "1fr", gap: 14,
                            background: "#131b16", border: "1px solid #1f2a23", borderRadius: 8, padding: 18
                        }}>
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
                    </div>
                </section>

                {/* Novo jogador */}
                <section style={{ marginBottom: 48 }}>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 12 }}>
                        Novo Jogador
                    </div>
                    <form onSubmit={cadastrarJogador} style={{
                        display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr auto", gap: 12,
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
                        <button type="submit" style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "#3fb950", color: "#0e1410", border: "none",
                            borderRadius: 6, padding: "0 22px", fontWeight: 600, fontSize: 14,
                            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap"
                        }}>
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
                        <div style={{ width: 520, background: "#0e1410", border: "1px solid #1f2a23", borderRadius: 8, padding: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, color: "#3fb950", fontWeight: 600 }}>Editar Jogador</div>
                                <button onClick={fecharEditar} aria-label="Fechar" style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer" }}>
                                    <FiX size={18} />
                                </button>
                            </div>
                            <form onSubmit={atualizarJogador} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <input className="field" type="text" placeholder="Nome" value={editando.nome || ""}
                                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })} required />
                                <input className="field" type="number" placeholder="Idade" value={editando.idade || ""}
                                    onChange={(e) => setEditando({ ...editando, idade: e.target.value })} required />
                                <input className="field" type="text" placeholder="Posição" value={editando.posicao || ""}
                                    onChange={(e) => setEditando({ ...editando, posicao: e.target.value })} required />
                                <input className="field" type="number" placeholder="Nº da camisa" value={editando.numeroCamisa || ""}
                                    onChange={(e) => setEditando({ ...editando, numeroCamisa: e.target.value })} required />

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
