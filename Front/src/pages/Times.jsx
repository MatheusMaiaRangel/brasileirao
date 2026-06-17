import { useCallback, useEffect, useRef, useState } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiMapPin, FiCalendar, FiX, FiImage } from "react-icons/fi";
import Swal from "sweetalert2";
import api, { comImagem } from "../services/api";
import { getTimeId, getTimeImageUrl } from "../utils/timeHelpers";
import "./Times.css";
import logoBrasileirao from "../assets/Logo_br.png";

const INITIAL_FORM = { nome: "", estadio: "", anoFundacao: "" };
const EMPTY_MESSAGE = "Nenhum clube cadastrado ainda. Use o formulário acima para adicionar o primeiro.";



// Extrai a mensagem de erro vinda da API, ou usa um texto padrão
function getErrorMsg(error, fallback) {
  return error?.response?.data?.erro
    || error?.response?.data?.mensagem
    || error?.message
    || fallback;
}

// Campos do formulário (reutilizados no "Novo Registro" e no modal de edição)
function TimeFields({ values, onChange, arquivo, onArquivo, imagemAtualUrl, idPrefix }) {
  const isEdit = idPrefix === "edit";

  const fileLabel = (
    <label className={`file-label${arquivo ? " has-file" : ""}`} title="Escudo do clube (opcional)">
      <FiImage size={15} />
      {arquivo ? arquivo.name : isEdit ? "Trocar escudo" : "Escudo (opcional)"}
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onArquivo(e.target.files[0] || null)}
      />
    </label>
  );

  return (
    <>
      <input
        className="field"
        type="text"
        placeholder="Nome do clube"
        value={values.nome || ""}
        onChange={(e) => onChange({ ...values, nome: e.target.value })}
        required
        style={isEdit ? { gridColumn: "1 / -1" } : undefined}
      />
      <input
        className="field"
        type="text"
        placeholder="Estádio"
        value={values.estadio || ""}
        onChange={(e) => onChange({ ...values, estadio: e.target.value })}
        required
      />
      <input
        className="field"
        type="number"
        placeholder="Fundação"
        value={values.anoFundacao || ""}
        onChange={(e) => onChange({ ...values, anoFundacao: e.target.value })}
        required
      />
      {isEdit ? (
        <div className="upload-row">
          {(arquivo || imagemAtualUrl) && (
            <img
              className="img-preview"
              src={arquivo ? URL.createObjectURL(arquivo) : imagemAtualUrl}
              alt="Escudo do clube"
            />
          )}
          {fileLabel}
        </div>
      ) : (
        fileLabel
      )}
    </>
  );
}

// Card individual de cada clube — clicável para selecionar o time (onSelecionarTime)
function TimeCard({ time, onSelecionar, onEdit, onDelete }) {
  const logoUrl = getTimeImageUrl(time, api.defaults.baseURL);

  return (
    <div
      className="card-team"
      onClick={() => onSelecionar && onSelecionar(time)}
      title="Ver detalhes do clube"
    >
      <div className="card-actions">
        <button
          className="icon-btn edit-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(time); }}
          title="Editar clube"
        >
          <FiEdit2 size={18} />
        </button>
        <button
          className="icon-btn del-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(getTimeId(time)); }}
          title="Remover clube"
        >
          <FiTrash2 size={18} />
        </button>
      </div>

      {logoUrl && <img className="card-logo" src={logoUrl} alt={`Escudo do ${time.nome}`} />}

      <div className="card-title">{time.nome}</div>

      <div className="card-row">
        <span><FiMapPin size={14} /> Estádio</span>
        <span>{time.estadio}</span>
      </div>

      <div className="card-row">
        <span><FiCalendar size={14} /> Fundação</span>
        <span className="accent">{time.anoFundacao}</span>
      </div>
    </div>
  );
}

export default function Times({ onSelecionarTime }) {
  const [times, setTimes] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [arquivo, setArquivo] = useState(null);          // escudo selecionado no "Novo Registro"
  const [message, setMessage] = useState(null);          // feedback de sucesso/erro
  const [editingTime, setEditingTime] = useState(null);  // clube sendo editado (abre o modal)
  const [arquivoEdicao, setArquivoEdicao] = useState(null); // novo escudo no modal de edição
  const messageTimeoutRef = useRef(null);

  // Abre/fecha o modal de edição, sempre limpando o arquivo selecionado
  function abrirEdicao(time) {
    setEditingTime(time);
    setArquivoEdicao(null);
  }
  function fecharEdicao() {
    setEditingTime(null);
    setArquivoEdicao(null);
  }

  // Mostra uma mensagem de feedback por 3 segundos
  function showMessage(text, type = "success") {
    if (messageTimeoutRef.current) window.clearTimeout(messageTimeoutRef.current);
    setMessage({ text, type });
    messageTimeoutRef.current = window.setTimeout(() => setMessage(null), 3000);
  }

  // ── READ: carrega a lista de times da API ──
  const carregarTimes = useCallback(async () => {
    try {
      const response = await api.get("/times");
      setTimes(response.data.dados || response.data || []);
    } catch (error) {
      console.error(error);
      showMessage("Erro ao carregar times", "error");
    }
  }, []);

  useEffect(() => {
    void carregarTimes();
  }, [carregarTimes]);

  // ── CREATE: cadastra um novo time ──
  async function cadastrarTime(event) {
    event.preventDefault();
    try {
      await api.post("/times", comImagem(form, arquivo));
      setForm(INITIAL_FORM);
      setArquivo(null);
      event.target.reset();
      await carregarTimes();
      showMessage("Time adicionado com sucesso.");
    } catch (error) {
      console.error(error);
      showMessage(getErrorMsg(error, "Erro ao cadastrar time"), "error");
    }
  }

  // ── DELETE: remove um time existente ──
  async function deletarTime(id) {
    if (!id) return showMessage("ID do time não encontrado", "error");

    const result = await Swal.fire({
      title: "Excluir clube?",
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
      await api.delete(`/times/${id}`);
      await carregarTimes();
      showMessage("Time removido com sucesso.");
    } catch (error) {
      console.error(error);
      showMessage(getErrorMsg(error, "Erro ao remover time"), "error");
    }
  }

  // ── UPDATE: salva as alterações do time em edição ──
  async function atualizarTime(event) {
    event.preventDefault();
    const id = getTimeId(editingTime);
    if (!id) return showMessage("ID do time não encontrado para atualização", "error");

    try {
      const dados = {
        nome: editingTime.nome,
        estadio: editingTime.estadio,
        anoFundacao: editingTime.anoFundacao,
      };
      await api.put(`/times/${id}`, comImagem(dados, arquivoEdicao));
      fecharEdicao();
      await carregarTimes();
      showMessage("Time atualizado com sucesso.");
    } catch (error) {
      console.error(error);
      showMessage(getErrorMsg(error, "Erro ao atualizar time"), "error");
    }
  }

  return (
    <div className="page">

      {/*  Cabeçalho  */}
      <header className="header">
  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
    <img
      src={logoBrasileirao}
      alt="Brasileirão"
      style={{
        width: "100px",
        height: "100px",
        objectFit: "contain",
      }}
    />

    <div>
      <div className="eyebrow">Central do Brasileirão</div>
      <h1 className="title">Cadastro de Times</h1>
    </div>
  </div>

  <div className="count">
    <div className="count-num">
      {String(times.length).padStart(2, "0")}
    </div>

    <div className="count-label">
      {times.length === 1
        ? "clube registrado"
        : "clubes registrados"}
    </div>
  </div>
</header>

      <div className="container">

        {/* Mensagem de sucesso/erro */}
        {message && (
          <div className={`feedback ${message.type}`}>{message.text}</div>
        )}

        {/*  Formulário: novo registro  */}
        <div className="section-label">Novo Registro</div>
        <form onSubmit={cadastrarTime} className="form panel">
          <TimeFields
            values={form}
            onChange={setForm}
            arquivo={arquivo}
            onArquivo={setArquivo}
            idPrefix="new"
          />
          <button type="submit" className="btn btn-primary">
            <FiPlus size={16} /> Adicionar
          </button>
        </form>

        {/*  Lista de clubes  */}
        <div className="section-label">Clubes</div>
        {times.length === 0 ? (
          <div className="empty">{EMPTY_MESSAGE}</div>
        ) : (
          <div className="grid">
            {times.map((time, i) => (
              <TimeCard
                key={getTimeId(time) ?? i}
                time={time}
                onSelecionar={onSelecionarTime}
                onEdit={abrirEdicao}
                onDelete={deletarTime}
              />
            ))}
          </div>
        )}
      </div>

      {/*  Modal de edição  */}
      {editingTime && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header">
              Editar Clube
              <button className="modal-close" onClick={fecharEdicao} aria-label="Fechar">
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={atualizarTime} className="modal-form">
              <TimeFields
                values={editingTime}
                onChange={setEditingTime}
                arquivo={arquivoEdicao}
                onArquivo={setArquivoEdicao}
                imagemAtualUrl={getTimeImageUrl(editingTime, api.defaults.baseURL)}
                idPrefix="edit"
              />
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary modal-btn">Salvar</button>
                <button type="button" className="btn btn-ghost" onClick={fecharEdicao}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}