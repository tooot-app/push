import Koa from 'koa'
import npmlog from 'npmlog'
import { getConnection, getRepository } from 'typeorm'
import { ExpoToken } from '../entity/ExpoToken'
import { cacheIdExpoToken } from '../util/cacheIdPush'

const updateExpoToken = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!ctx.state.expoToken) {
    npmlog.warn('updateExpoToken', 'Expo Token not in context state')
    ctx.throw(500, 'updateExpoToken: Expo Token not in context state')
  }

  const expoToken: ExpoToken['expoToken'] = ctx.state.expoToken

  const repoET = getRepository(ExpoToken)
  const foundET = await repoET.findOne({
    where: { expoToken },
    cache: {
      id: expoToken,
      milliseconds: 86400000
    }
  })

  if (foundET) {
    await repoET.save({
      expoToken: foundET.expoToken,
      connectedTimestamp: new Date(Date.now()).toISOString()
    })
  } else {
    const connection = getConnection()
    await connection.queryResultCache?.remove([cacheIdExpoToken({ expoToken })])
    npmlog.warn('updateExpoToken', 'cannot found corresponding Expo Token')
    ctx.throw(500, 'updateExpoToken: cannot found corresponding Expo Token')
  }

  await next()
}

export default updateExpoToken