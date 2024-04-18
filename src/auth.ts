import type { DidResolver } from '@atproto/identity'
import { AuthRequiredError, verifyJwt } from '@atproto/xrpc-server'
import type express from 'express'

export const validateAuth = async (
  req: express.Request,
  serviceDid: string,
  didResolver: DidResolver,
): Promise<string> => {
  const { authorization = '' } = req.headers
  if (!authorization.startsWith('Bearer ')) {
    throw new AuthRequiredError()
  }
  const jwt = authorization.replace('Bearer ', '').trim()
  return verifyJwt(jwt, serviceDid, async (did: string) => {
    return didResolver.resolveAtprotoKey(did)
  })
}
