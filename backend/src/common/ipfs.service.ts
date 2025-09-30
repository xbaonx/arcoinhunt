import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import { appConfig } from './config';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly cfg = appConfig();

  async uploadImage(buffer: Buffer, filename: string) {
    if (this.cfg.ipfsProvider === 'pinata') {
      return this.uploadViaPinata(buffer, filename);
    }
    return this.uploadViaInfura(buffer, filename);
  }

  async uploadJson(json: any) {
    if (this.cfg.ipfsProvider === 'pinata') {
      return this.uploadJsonViaPinata(json);
    }
    return this.uploadJsonViaInfura(json);
  }

  private async uploadViaPinata(buffer: Buffer, filename: string) {
    const fd = new FormData();
    fd.append('file', buffer, { filename });
    try {
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', fd, {
        headers: {
          ...fd.getHeaders(),
          pinata_api_key: this.cfg.ipfsKey,
          pinata_secret_api_key: this.cfg.ipfsSecret,
        },
        maxBodyLength: Infinity,
      });
      const cid = res.data.IpfsHash;
      return { cid, url: `ipfs://${cid}` };
    } catch (e: any) {
      this.logger.error('Pinata file upload failed', e?.response?.data || e.message);
      throw new InternalServerErrorException('IPFS upload failed');
    }
  }

  private async uploadJsonViaPinata(json: any) {
    try {
      const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', json, {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: this.cfg.ipfsKey,
          pinata_secret_api_key: this.cfg.ipfsSecret,
        },
      });
      const cid = res.data.IpfsHash;
      return { cid, url: `ipfs://${cid}` };
    } catch (e: any) {
      this.logger.error('Pinata json upload failed', e?.response?.data || e.message);
      throw new InternalServerErrorException('IPFS upload failed');
    }
  }

  private async uploadViaInfura(buffer: Buffer, filename: string) {
    const fd = new FormData();
    fd.append('file', buffer, { filename });
    try {
      const endpoint = 'https://ipfs.infura.io:5001/api/v0/add';
      const res = await axios.post(endpoint, fd, {
        headers: {
          ...fd.getHeaders(),
          Authorization: 'Basic ' + Buffer.from(`${this.cfg.ipfsKey}:${this.cfg.ipfsSecret}`).toString('base64'),
        },
        maxBodyLength: Infinity,
      });
      const cid = res.data.Hash;
      return { cid, url: `ipfs://${cid}` };
    } catch (e: any) {
      this.logger.error('Infura file upload failed', e?.response?.data || e.message);
      throw new InternalServerErrorException('IPFS upload failed');
    }
  }

  private async uploadJsonViaInfura(json: any) {
    try {
      const endpoint = 'https://ipfs.infura.io:5001/api/v0/add?pin=true';
      const fd = new FormData();
      fd.append('file', Buffer.from(JSON.stringify(json)), { filename: 'metadata.json', contentType: 'application/json' });
      const res = await axios.post(endpoint, fd, {
        headers: {
          ...fd.getHeaders(),
          Authorization: 'Basic ' + Buffer.from(`${this.cfg.ipfsKey}:${this.cfg.ipfsSecret}`).toString('base64'),
        },
      });
      const cid = res.data.Hash;
      return { cid, url: `ipfs://${cid}` };
    } catch (e: any) {
      this.logger.error('Infura json upload failed', e?.response?.data || e.message);
      throw new InternalServerErrorException('IPFS upload failed');
    }
  }
}
