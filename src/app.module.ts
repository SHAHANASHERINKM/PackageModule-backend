import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetails } from './package/entities/user.entity';
import { FeeDetails } from './package/entities/fee.entities';
import { PackageModule } from './package/package.module';
import { SuccessMessage } from './package/entities/success-message.entities';
import { Category } from './package/entities/categories.entity';
import { Packages } from './package/entities/packages.entity';
import { IntendedLearners } from './package/entities/intended-learners.entities';
import { CourseLandingPage } from './package/entities/course-landing-page.entities';
import { CartItem } from './package/entities/cart_items.entity';
import { WishList } from './package/entities/wish-list.entites';
import { ScheduleModule } from '@nestjs/schedule';
import { PurchasedPackage } from './package/entities/purchased-packages.entity';
import { CoursesController } from './courses/courses.controller';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type:'postgres',
      host:'localhost',
      port:5433,
      username:'postgres',
      password:'shahana@2002',
      database:'package',
      entities:[UserDetails,FeeDetails
       ,SuccessMessage,Category,Packages,IntendedLearners,CourseLandingPage,CartItem,WishList,PurchasedPackage
       
      ],
      synchronize:true,
    }),PackageModule,ScheduleModule.forRoot(),
  ],
  controllers: [AppController, CoursesController],
  providers: [AppService],
})
export class AppModule {}

