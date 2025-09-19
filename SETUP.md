# 🚀 ELEVEA - Setup e Configuração

## 📋 Variáveis de Ambiente Necessárias

### **Netlify Functions:**
```bash
GAS_BASE_URL=https://script.google.com/macros/s/SEU_SCRIPT_ID/exec
VITE_UPGRADE_URL=https://sua-pagina-de-upgrade.com
```

## 🔗 Endpoints do GAS

### **GET (Query Parameters):**
- `?type=status&site=SLUG` - Status do site
- `?type=get_settings&site=SLUG` - Configurações do site
- `?type=list_leads&site=SLUG&page=1&pageSize=20` - Lista de leads
- `?type=list_feedbacks&site=SLUG&page=1&pageSize=20` - Lista de feedbacks
- `?type=get_traffic&site=SLUG&range=30d` - Dados de tráfego
- `?type=assets&site=SLUG` - Lista de assets

### **POST (JSON Body):**
- `type: "client_billing"` + `email` - Dados de cobrança
- `type: "save_settings"` + `siteSlug`, `settings`, `pin?` - Salvar configurações
- `type: "record_hit"` + `siteSlug`, `meta` - Registrar acesso
- `type: "create_lead"` + `siteSlug`, `name`, `email`, `phone`, `extra?` - Criar lead
- `type: "create_feedback"` + `siteSlug`, `rating`, `comment`, `name?`, `email?` - Criar feedback
- `type: "feedback_set_approval"` + `siteSlug`, `id`, `approved`, `pin` - Aprovar/rejeitar feedback
- `type: "upload_base64"` + `siteSlug`, `email`, `logo?`, `fotos[]` - Upload de assets

## 🛠️ Netlify Functions

### **Funções Disponíveis:**
- `/.netlify/functions/client-plan` - Status consolidado do cliente
- `/.netlify/functions/subscription-status` - Status da assinatura
- `/.netlify/functions/client-billing` - Dados de cobrança
- `/.netlify/functions/assets` - Gerenciar assets
- `/.netlify/functions/client-api` - API geral do dashboard

## ⚙️ Como Configurar

1. **No Netlify:**
   - Vá em Site Settings > Environment Variables
   - Adicione `GAS_BASE_URL` com a URL do seu GAS
   - Adicione `VITE_UPGRADE_URL` com a URL de upgrade

2. **No GAS:**
   - Certifique-se que o web app está publicado
   - Teste os endpoints manualmente
   - Verifique as permissões do Google Sheets

## 🐛 Troubleshooting

### **Problemas Comuns:**
- **VIP não detectado:** Verifique se `GAS_BASE_URL` está correto
- **Feedbacks não aparecem:** Verifique se o endpoint `list_feedbacks` está funcionando
- **CORS errors:** Verifique se o GAS está configurado para aceitar requisições do Netlify

### **Logs:**
- Netlify Functions: Vá em Functions > View logs
- GAS: Vá em Executions para ver logs de execução
