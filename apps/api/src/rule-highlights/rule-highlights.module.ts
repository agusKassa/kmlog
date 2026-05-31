import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { RuleHighlight, RuleHighlightSchema } from './schemas/rule-highlight.schema'
import { RuleHighlightsService } from './rule-highlights.service'
import { RuleHighlightsController } from './rule-highlights.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: RuleHighlight.name, schema: RuleHighlightSchema }])],
  controllers: [RuleHighlightsController],
  providers: [RuleHighlightsService],
  exports: [RuleHighlightsService],
})
export class RuleHighlightsModule {}
