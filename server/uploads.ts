import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { Request, Response } from 'express';
import { IStorage } from './database';
import crypto from 'crypto';

// Configuração do multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const siteSlug = req.body.siteSlug;
    if (!siteSlug) {
      return cb(new Error('siteSlug obrigatório'), '');
    }

    const uploadPath = path.join(process.cwd(), 'uploads', siteSlug);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    // Gerar nome único mantendo extensão
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(8).toString('hex');
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}_${hash}_${safeName}`;
    cb(null, filename);
  }
});

// Filtros e limites
const fileFilter = (req: any, file: any, cb: any) => {
  // Tipos permitidos
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
    files: 10 // máximo 10 arquivos por vez
  }
});

export function createUploadHandler(dbStorage: IStorage) {
  return [
    upload.array('files', 10), // Campo 'files', máximo 10 arquivos
    async (req: Request, res: Response) => {
      try {
        const { siteSlug } = req.body;
        
        if (!siteSlug) {
          return res.status(400).json({ ok: false, error: 'siteSlug_obrigatorio' });
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({ ok: false, error: 'nenhum_arquivo_enviado' });
        }

        const savedAssets = [];

        // Salvar cada arquivo no banco
        for (const file of files) {
          const relativePath = path.relative(process.cwd(), file.path);
          
          const asset = await dbStorage.createAsset({
            siteSlug,
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: relativePath,
            category: getCategoryFromMimetype(file.mimetype),
            isPublic: true
          });

          savedAssets.push({
            id: asset.id,
            filename: asset.filename,
            originalName: asset.originalName,
            url: `/${relativePath}`,
            size: asset.size,
            mimetype: asset.mimetype,
            category: asset.category
          });
        }

        res.json({
          ok: true,
          message: `${files.length} arquivo(s) enviado(s) com sucesso`,
          assets: savedAssets
        });

      } catch (error) {
        console.error('Erro no upload:', error);
        
        // Limpar arquivos em caso de erro
        if (req.files) {
          const files = req.files as Express.Multer.File[];
          for (const file of files) {
            try {
              await fs.unlink(file.path);
            } catch {}
          }
        }

        if (error instanceof multer.MulterError) {
          let message = 'Erro no upload';
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              message = 'Arquivo muito grande (máximo 10MB)';
              break;
            case 'LIMIT_FILE_COUNT':
              message = 'Muitos arquivos (máximo 10)';
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = 'Campo de arquivo inesperado';
              break;
          }
          return res.status(400).json({ ok: false, error: message });
        }

        res.status(500).json({ 
          ok: false, 
          error: 'Erro interno no upload'
        });
      }
    }
  ];
}

function getCategoryFromMimetype(mimetype: string): string {
  if (mimetype.startsWith('image/')) {
    return 'imagem';
  } else if (mimetype === 'application/pdf') {
    return 'documento';
  } else if (mimetype.includes('word') || mimetype === 'text/plain') {
    return 'documento';
  } else {
    return 'geral';
  }
}

// Handler para upload via base64 (compatibilidade com sistema antigo)
export function createBase64UploadHandler(dbStorage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { siteSlug, files } = req.body;

      if (!siteSlug) {
        return res.status(400).json({ ok: false, error: 'siteSlug_obrigatorio' });
      }

      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ ok: false, error: 'dados_de_arquivo_invalidos' });
      }

      const savedAssets = [];

      for (const fileData of files) {
        const { filename, content, mimetype } = fileData;
        
        if (!filename || !content || !mimetype) {
          continue;
        }

        // Decodificar base64
        const buffer = Buffer.from(content, 'base64');
        
        if (buffer.length > 10 * 1024 * 1024) {
          throw new Error('Arquivo muito grande (máximo 10MB)');
        }

        // Criar diretório
        const uploadDir = path.join(process.cwd(), 'uploads', siteSlug);
        await fs.mkdir(uploadDir, { recursive: true });

        // Salvar arquivo
        const hash = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(filename);
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const newFilename = `${Date.now()}_${hash}_${safeName}`;
        const filePath = path.join(uploadDir, newFilename);

        await fs.writeFile(filePath, buffer);

        // Salvar no banco
        const relativePath = path.relative(process.cwd(), filePath);
        const asset = await dbStorage.createAsset({
          siteSlug,
          filename: newFilename,
          originalName: filename,
          mimetype,
          size: buffer.length,
          path: relativePath,
          category: getCategoryFromMimetype(mimetype),
          isPublic: true
        });

        savedAssets.push({
          id: asset.id,
          filename: asset.filename,
          originalName: asset.originalName,
          url: `/${relativePath}`,
          size: asset.size,
          mimetype: asset.mimetype,
          category: asset.category
        });
      }

      res.json({
        ok: true,
        message: `${savedAssets.length} arquivo(s) processado(s)`,
        assets: savedAssets
      });

    } catch (error) {
      console.error('Erro no upload base64:', error);
      res.status(500).json({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Erro interno'
      });
    }
  };
}