import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { FiPlus, FiTrash2, FiEdit2, FiX, FiImage } from "react-icons/fi";
import Swal from "sweetalert2";
import api, { comImagem } from "../services/api";
import { getTimeImageUrl } from "../utils/timeHelpers";
import "./Times.css";
import "./responsive.css";
import type { ApiResponse, Tecnico } from "../types";

type Feedback = "success" | "error";

const INITIAL_FORM = { nome: "", idade: "" };
const LABEL_STYLE = { fontFamily: "Oswald, sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#6b7a70", textTransform: "uppercase" as const, marginBottom: 12 };
const ICON_BTN_STYLE = { display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer", fontSize: 13, fontFamily: "inherit", letterSpacing: "0.05em" };

function getErrorMsg(error: unknown, fallback: string): string {
    return axios.isAxiosError<{ erro?: string }>(error) ? error.response?.data?.erro || fallback : fallback;
}

export default function TecnicoSecao({ timeId, onMensagem }: {
    timeId: string;
    onMensagem: (text: string, type?: Feedback) => void;
}) {
    const [tecnico, setTecnico] = useState<Tecnico | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [form, setForm] = useState(INITIAL_FORM);
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [editando, setEditando] = useState<Tecnico | null>(null);
    const [arquivoEdicao, setArquivoEdicao] = useState<File | null>(null);

    const carregarTecnico = useCallback(async () => {
        setCarregando(true);
        try {
            const response = await api.get<ApiResponse<Tecnico | null>>(`/times/${timeId}/tecnico`);
            setTecnico(response.data.dados || null);
        } catch (error) {
            console.error(error);
            onMensagem("Erro ao carregar técnico", "error");
        } finally {
            setCarregando(false);
        }
    }, [timeId, onMensagem]);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            void carregarTecnico();
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [carregarTecnico]);

    async function cadastrarTecnico(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formElement = e.currentTarget;
        try {
            const dados = { nome: form.nome, idade: String(form.idade), timeId };
            await api.post("/tecnicos", comImagem(dados, arquivo));
            setForm(INITIAL_FORM);
            setArquivo(null);
            formElement.reset();
            await carregarTecnico();
            onMensagem("Técnico adicionado com sucesso.");
        } catch (error) {
            console.error(error);
            onMensagem(getErrorMsg(error, "Erro ao cadastrar técnico"), "error");
        }
    }

    async function deletarTecnico() {
        const id = tecnico?.id || tecnico?._id;
        if (!id) return;

        const result = await Swal.fire({
            title: "Excluir técnico?",
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
            await api.delete(`/tecnicos/${id}`);
            await carregarTecnico();
            onMensagem("Técnico removido com sucesso.");
        } catch (error) {
            console.error(error);
            onMensagem(getErrorMsg(error, "Erro ao remover técnico"), "error");
        }
    }

    function abrirEditar() {
        if (!tecnico) return;
        setEditando({ ...tecnico });
        setArquivoEdicao(null);
    }

    function fecharEditar() {
        setEditando(null);
        setArquivoEdicao(null);
    }

    async function atualizarTecnico(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editando) return;
        const id = editando.id || editando._id;
        try {
            const dados = { nome: editando.nome, idade: String(editando.idade) };
            await api.put(`/tecnicos/${id}`, comImagem(dados, arquivoEdicao));
            fecharEditar();
            await carregarTecnico();
            onMensagem("Técnico atualizado com sucesso.");
        } catch (error) {
            console.error(error);
            onMensagem(getErrorMsg(error, "Erro ao atualizar técnico"), "error");
        }
    }

    const fotoUrl = getTimeImageUrl(tecnico, api.defaults.baseURL);

    return (
        <section style={{ marginBottom: 48 }}>
            <div style={LABEL_STYLE}>Técnico</div>

            {carregando ? (
                <div style={{ color: "#6b7a70", fontSize: 14, padding: "24px 0" }}>Carregando técnico...</div>
            ) : tecnico ? (
                <div className="row-player" style={{
                    background: "#131b16", border: "1px solid #1f2a23", borderRadius: 8,
                    padding: "14px 18px", display: "flex", alignItems: "center", gap: 16
                }}>
                    {fotoUrl && <img className="player-avatar" src={fotoUrl} alt={tecnico.nome} />}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 17, fontWeight: 600 }}>{tecnico.nome}</div>
                        <div style={{ fontSize: 13, color: "#a8b5ad" }}>Técnico · {tecnico.idade} anos</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="edit-btn" onClick={abrirEditar} title="Editar técnico" style={ICON_BTN_STYLE}>
                            <FiEdit2 size={18} />
                        </button>
                        <button className="del-btn" onClick={deletarTecnico} title="Remover técnico" style={ICON_BTN_STYLE}>
                            <FiTrash2 size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <form className="player-form" onSubmit={cadastrarTecnico} style={{
                    display: "grid", gridTemplateColumns: "3fr 1fr 1.6fr auto", gap: 12, alignItems: "center",
                    background: "#131b16", border: "1px solid #1f2a23", borderRadius: 8, padding: 18
                }}>
                    <input className="field" type="text" placeholder="Nome do técnico" value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                    <input className="field" type="number" placeholder="Idade" value={form.idade}
                        onChange={(e) => setForm({ ...form, idade: e.target.value })} required />
                    <label className={`file-label${arquivo ? " has-file" : ""}`} title="Foto do técnico (opcional)">
                        <FiImage size={15} />
                        {arquivo ? arquivo.name : "Foto (opcional)"}
                        <input type="file" accept="image/*" hidden
                            onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
                    </label>
                    <button type="submit" className="btn btn-primary btn-add">
                        <FiPlus size={16} /> Adicionar técnico
                    </button>
                </form>
            )}

            {/* Modal editar técnico */}
            {editando && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
                    <div className="player-edit-modal" style={{ width: 520, background: "#0e1410", border: "1px solid #1f2a23", borderRadius: 8, padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, color: "#3fb950", fontWeight: 600 }}>Editar Técnico</div>
                            <button onClick={fecharEditar} aria-label="Fechar" style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", color: "#6b7a70", cursor: "pointer" }}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <form className="player-edit-form" onSubmit={atualizarTecnico} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <input className="field" type="text" placeholder="Nome" value={editando.nome || ""}
                                onChange={(e) => setEditando({ ...editando, nome: e.target.value })} required />
                            <input className="field" type="number" placeholder="Idade" value={editando.idade || ""}
                                onChange={(e) => setEditando({ ...editando, idade: e.target.value })} required />

                            <div className="upload-row">
                                {(arquivoEdicao || getTimeImageUrl(editando, api.defaults.baseURL)) && (
                                    <img className="img-preview" style={{ borderRadius: "50%" }}
                                        src={arquivoEdicao ? URL.createObjectURL(arquivoEdicao) : getTimeImageUrl(editando, api.defaults.baseURL)}
                                        alt="Foto do técnico" />
                                )}
                                <label className={`file-label${arquivoEdicao ? " has-file" : ""}`} title="Trocar foto">
                                    <FiImage size={15} />
                                    {arquivoEdicao ? arquivoEdicao.name : "Trocar foto (opcional)"}
                                    <input type="file" accept="image/*" hidden
                                        onChange={(e) => setArquivoEdicao(e.target.files?.[0] || null)} />
                                </label>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "1 / -1" }}>
                                <button type="submit" style={{ background: "#3fb950", color: "#0e1410", border: "none", borderRadius: 6, padding: "8px 14px", fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                                <button type="button" onClick={fecharEditar} style={{ background: "transparent", color: "#6b7a70", border: "1px solid #2a352e", borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
