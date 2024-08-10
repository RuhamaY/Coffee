import { Injectable, NotFoundException, BadRequestException, Post, Body, Inject, Scope } from '@nestjs/common';
import { Coffee } from './entities/coffee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Flavor } from './entities/flavor.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Event } from 'src/events/entities/event.entity';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class CoffeesService {
    coffeesService: any;
    
    constructor(
        @InjectRepository(Coffee)
        private readonly coffeeRepository: Repository<Coffee>,

        @InjectRepository(Flavor)
        private readonly flavorRepository: Repository<Flavor>,

        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,

    ) {
        const databaseHost = this.configService.get<string>('DATABASE_HOST');
        console.log(databaseHost);
    }

    findAll(paginationQuery: PaginationQueryDto) {
        const { limit, offset } = paginationQuery;
        return this.coffeeRepository.find({
            relations: ['flavors'],
            skip: offset,
            take: limit,
        });
    }

    async findOne(id: string): Promise<Coffee> {
        const numericId = parseInt(id, 10);
        if(isNaN(numericId)){
            throw new BadRequestException('invalid Id format');
        }
        const coffee = await this.coffeeRepository.findOne({where:{id:numericId}, relations:['flavors']});
        if(!coffee){
            throw new NotFoundException(`Coffee ${id} not found`);
        }
        
        return coffee;
    }

   
    async create(createCoffeeDTO: CreateCoffeeDto){
        const flavors = await Promise.all(
            createCoffeeDTO.flavors.map(name => this.preloadCoffeeByName(name)),
        );

        const coffee = this.coffeeRepository.create({
            ...createCoffeeDTO,
            flavors,
        });
        return this.coffeeRepository.save(coffee);
    }

    async update(id:string, updateCoffeeDTO: UpdateCoffeeDto){
        
        const flavors = 
        updateCoffeeDTO.flavors && 
        (await Promise.all(
            updateCoffeeDTO.flavors.map(name => this.preloadCoffeeByName(name)),
        ))
        const coffee = await this.coffeeRepository.preload({
            id: +id,
            ...updateCoffeeDTO,
            flavors,
        });

        if(!coffee) {
            throw new NotFoundException(`Coffee ${id} not found.`);
        }

        return this.coffeeRepository.save(coffee);
    }

    async remove(id:string){
        const coffee = await this.findOne(id);
        return this.coffeeRepository.remove(coffee);
    }

    async recommendCoffee(coffee: Coffee) {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();
        try{
            coffee.recommendations++;

            const recommendEvent = new Event();
            recommendEvent.name = 'recommend_coffee';
            recommendEvent.type = 'coffee';
            recommendEvent.payload = {coffeeId: coffee.id};

            await queryRunner.manager.save(coffee);
            await queryRunner.manager.save(recommendEvent);

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    }

    private async preloadCoffeeByName(name: string):Promise<Flavor> {
        const existingFlavor = await this.flavorRepository.findOne({where:{name}});

        if(existingFlavor){
            return existingFlavor;
        }

        return this.flavorRepository.create({name});
    }
}
