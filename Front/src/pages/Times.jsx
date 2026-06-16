import { useEffect, useState } from "react";
import api from "../services/api";

export default function App({ onSelecionarTime }) {
    const [times, setTimes] = useState([]);
    const [form, setForm] = useState({ nome: "", estadio: "", anoFundacao: "" });
    const [showEdit, setShowEdit] = useState(false);
    const [editingTime, setEditingTime] = useState(null);

    async function carregarTimes() {
        try {
            const response = await api.get("/times");
            setTimes(response.data.dados || response.data || []);
        } catch (error) {
            console.error(error);
            alert("Erro ao carregar times");
        }
    }

    useEffect(() => { carregarTimes(); }, []);

    async function cadastrarTime(e) {
        e.preventDefault();
        try {
            await api.post("/times", form);
            setForm({ nome: "", estadio: "", anoFundacao: "" });
            carregarTimes();
        } catch (error) {
            console.error(error);
            alert("Erro ao cadastrar time");
        }
    }

    async function deletarTime(id) {
        if (!id) return alert("ID do time não encontrado");
        try {
            await api.delete(`/times/${id}`);
            carregarTimes();
        } catch (error) {
            console.error(error);
            const serverMsg = error?.response?.data?.erro || error?.response?.data?.mensagem || error?.message;
            alert(serverMsg || "Erro ao remover time");
        }
    }

    function abrirEditarTime(time) {
        setEditingTime({ ...time });
        setShowEdit(true);
    }

    function fecharEditar() {
        setEditingTime(null);
        setShowEdit(false);
    }

    async function atualizarTime(e) {
        e.preventDefault();
        if (!editingTime) return;
        const id = editingTime.id || editingTime._id;
        if (!id) return alert("ID do time não encontrado para atualização");
        try {
            await api.put(`/times/${id}`, editingTime);
            setShowEdit(false);
            setEditingTime(null);
            carregarTimes();
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar time");
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#0e1410", color: "#eef1ee", fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;600;700&display=swap');
* { box-sizing: border-box; }
.field {
background: #161e19;
border: 1px solid #2a352e;
border-radius: 6px;
color: #eef1ee;
padding: 12px 14px;
font-size: 14px;
font-family: inherit;
outline: none;
width: 100%;
transition: border-color .15s;
}
.field::placeholder { color: #6b7a70; }
.field:focus { border-color: #3fb950; }
.card-team:hover { border-color: #3fb950; transform: translateY(-2px); }
.card-team { transition: border-color .15s, transform .15s; }
.del-btn { opacity: 0; transition: opacity .15s, color .15s; }
.card-team:hover .del-btn { opacity: 1; }
.del-btn:hover { color: #f3716b !important; }
.edit-btn { opacity: 0; transition: opacity .15s, color .15s; margin-right:8px }
.card-team:hover .edit-btn { opacity: 1; }
.edit-btn:hover { color: #ffd166 !important; }
`}</style>

            {/* Header */}
            <header style={{
                borderBottom: "1px solid #1f2a23", padding: "28px 32px",
                display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12
            }}>
                <div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 13, letterSpacing: "0.25em", color: "#3fb950", textTransform: "uppercase", marginBottom: 4 }}>
                        Súmula de Clubes
                    </div>
                    <h1 style={{ fontFamily: "Oswald, sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                        Cadastro de Times
                    </h1>
                </div>
                <div style={{ fontFamily: "Oswald, sans-serif", textAlign: "right" }}>
                    <div style={{ fontSize: 40, fontWeight: 700, color: "#3fb950", lineHeight: 1 }}>
                        {String(times.length).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#6b7a70", textTransform: "uppercase" }}>
                        {times.length === 1 ? "clube registrado" : "clubes registrados"}
                    </div>
                </div>
            </header>

            <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 32px 64px" }}>

                {/* Formulário */}
                <section style={{ marginBottom: 48 }}>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 12 }}>
                        Novo Registro
                    </div>
                    <form onSubmit={cadastrarTime} style={{
                        display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 12,
                        background: "#131b16", border: "1px solid #1f2a23", borderRadius: 8, padding: 18
                    }}>
                        <input className="field" type="text" placeholder="Nome do clube" value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                        <input className="field" type="text" placeholder="Estádio" value={form.estadio}
                            onChange={(e) => setForm({ ...form, estadio: e.target.value })} required />
                        <input className="field" type="number" placeholder="Fundação" value={form.anoFundacao}
                            onChange={(e) => setForm({ ...form, anoFundacao: e.target.value })} required />
                        <button type="submit" style={{
                            background: "#3fb950", color: "#0e1410", border: "none",
                            borderRadius: 6, padding: "0 22px", fontWeight: 600, fontSize: 14,
                            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap"
                        }}>
                            Adicionar
                        </button>
                    </form>
                </section>

                {/* Lista */}
                <section>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#6b7a70", textTransform: "uppercase", marginBottom: 12 }}>
                        Clubes
                    </div>

                    {times.length === 0 ? (
                        <div style={{
                            border: "1px dashed #2a352e", borderRadius: 8, padding: "48px 24px",
                            textAlign: "center", color: "#6b7a70", fontSize: 14
                        }}>
                            Nenhum clube cadastrado ainda. Use o formulário acima para adicionar o primeiro.
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                            {times.map((time, index) => (
                                <div key={time.id || time._id || index} className="card-team"
                                    onClick={() => onSelecionarTime && onSelecionarTime(time)}
                                    title="Ver detalhes do clube"
                                    style={{
                                        background: "#131b16", border: "1px solid #1f2a23", borderRadius: 8,
                                        padding: 18, display: "flex", flexDirection: "column", gap: 10, position: "relative", cursor: "pointer"
                                    }}>
                                    <div style={{ position: "absolute", top: 14, right: 14, display: "flex" }}>
                                        <button className="edit-btn" onClick={(e) => { e.stopPropagation(); abrirEditarTime(time); }} title="Editar clube" style={{
                                            background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer", fontSize: 13, fontFamily: "inherit", letterSpacing: "0.05em"
                                        }}>
                                            Editar
                                        </button>
                                        <button className="del-btn" onClick={(e) => { e.stopPropagation(); deletarTime(time.id || time._id); }} title="Remover clube" style={{
                                            background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer", fontSize: 13,
                                            fontFamily: "inherit", letterSpacing: "0.05em", marginLeft: 8
                                        }}>
                                            Remover
                                        </button>
                                    </div>
                                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 19, fontWeight: 600, paddingRight: 56 }}>
                                        {time.nome}
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#a8b5ad" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7a70" }}>Estádio</span>
                                            <span>{time.estadio}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7a70" }}>Fundação</span>
                                            <span style={{ color: "#3fb950", fontFamily: "Oswald, sans-serif", fontWeight: 600 }}>{time.anoFundacao}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {showEdit && editingTime && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
                        <div style={{ width: 520, background: "#0e1410", border: "1px solid #1f2a23", borderRadius: 8, padding: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, color: "#3fb950", fontWeight: 600 }}>Editar Clube</div>
                                <button onClick={() => fecharEditar()} style={{ background: "transparent", border: "none", color: "#d4220a", cursor: "pointer" }}>X</button>
                            </div>
                            <form onSubmit={atualizarTime} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <input className="field" type="text" placeholder="Nome do clube" value={editingTime.nome || ""}
                                    onChange={(e) => setEditingTime({ ...editingTime, nome: e.target.value })} required />
                                <input className="field" type="text" placeholder="Estádio" value={editingTime.estadio || ""}
                                    onChange={(e) => setEditingTime({ ...editingTime, estadio: e.target.value })} required />
                                <input className="field" type="number" placeholder="Fundação" value={editingTime.anoFundacao || ""}
                                    onChange={(e) => setEditingTime({ ...editingTime, anoFundacao: e.target.value })} required />
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <button type="submit" style={{ background: "#3fb950", color: "#0e1410", border: "none", borderRadius: 6, padding: "8px 14px", fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                                    <button type="button" onClick={() => fecharEditar()} style={{ background: "transparent", color: "#6b7a70", border: "1px solid #2a352e", borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
