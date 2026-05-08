import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Rule, RuleSchema } from './schemas/rule.schema'
import { RuleCategory, RuleCategorySchema } from './schemas/rule-category.schema'
import { RulesService } from './rules.service'
import { RulesController } from './rules.controller'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rule.name, schema: RuleSchema },
      { name: RuleCategory.name, schema: RuleCategorySchema },
    ]),
  ],
  controllers: [RulesController],
  providers: [RulesService],
})
export class RulesModule {}
