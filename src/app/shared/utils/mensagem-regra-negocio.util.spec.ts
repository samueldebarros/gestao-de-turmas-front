import { extrairMensagemDeRegra } from './mensagem-regra-negocio.util';

const MENSAGEM = 'A data de nascimento informada é inválida (idade superior a 120 anos).';

describe('extrairMensagemDeRegra', () => {
  describe('formatos que o servidor realmente produz', () => {
    it('lê o corpo quando ele chega como string', () => {
      expect(extrairMensagemDeRegra({ status: 422, error: MENSAGEM })).toBe(MENSAGEM);
    });

    it('lê o corpo quando o HttpClient embrulha o texto por falhar ao parsear JSON', () => {
      const erro = { status: 422, error: { error: new SyntaxError('...'), text: MENSAGEM } };

      expect(extrairMensagemDeRegra(erro)).toBe(MENSAGEM);
    });

    it('remove espaço em volta', () => {
      expect(extrairMensagemDeRegra({ error: `  ${MENSAGEM}  ` })).toBe(MENSAGEM);
    });
  });

  describe('recusa o que não é mensagem de regra', () => {
    it.each([
      { caso: 'corpo ausente', erro: { status: 500 } },
      { caso: 'corpo nulo', erro: { status: 422, error: null } },
      { caso: 'corpo vazio', erro: { status: 422, error: '   ' } },
      { caso: 'objeto sem text', erro: { status: 422, error: { title: 'Not Found' } } },
      { caso: 'erro que não é objeto', erro: 'falhou' },
      { caso: 'nulo', erro: null },
    ])('devolve nulo para $caso', ({ erro }) => {
      expect(extrairMensagemDeRegra(erro)).toBeNull();
    });

    it('recusa página HTML — o handler global redireciona e devolve markup', () => {
      const erro = { status: 422, error: '<!DOCTYPE html><html><body>Erro</body></html>' };

      expect(extrairMensagemDeRegra(erro)).toBeNull();
    });

    it('recusa texto longo demais para caber num alerta', () => {
      expect(extrairMensagemDeRegra({ error: 'x'.repeat(301) })).toBeNull();
    });
  });
});
